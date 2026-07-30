import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import type { Prisma } from "@scholarship/database";
import { PERMISSIONS } from "@scholarship/shared";
import type { Request } from "express";
import { randomBytes } from "node:crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import type { Queue } from "bullmq";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { MailService } from "../../infrastructure/mail/mail.service";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { SystemSettingsService } from "../../infrastructure/settings/system-settings.service";
import { PasswordHashService } from "../auth/services/password-hash.service";
import { NOTIFY_QUEUE_NAME } from "../auth/types/register.types";
import {
  AdminNoteDto,
  ApplicationAdminQueryDto,
  ApplicationDecisionDto,
  BannerUpsertDto,
  ConsultMessageDto,
  ConsultQueryDto,
  ConsultUpdateDto,
  EmailTemplateDto,
  EmailTestDto,
  IdsDto,
  JobIdsDto,
  NotificationQueryDto,
  NotificationPreferencesDto,
  PageQueryDto,
  PostUpsertDto,
  ReportUpdateDto,
  ReportScheduleDto,
  SettingsDto,
  SettingsQueryDto,
  StaticPageUpsertDto,
  TaxonomyMergeDto,
  TaxonomyUpsertDto,
  TeamInviteDto,
  TeamRoleDto,
  TotpVerifyDto,
  TrashActionDto,
  UserActionDto,
  PasswordChangeDto,
} from "./dto/admin-operations.dto";

type AdminRequest = Request & { user: { sub: string; role: string } };

@Controller("api/v1/admin")
export class AdminOperationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly storage: StorageService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly passwordHash: PasswordHashService,
    private readonly systemSettings: SystemSettingsService,
    @InjectQueue(NOTIFY_QUEUE_NAME) private readonly notifyQueue: Queue,
  ) {}

  @Get("users/:id")
  @RequirePermissions(PERMISSIONS.USER_READ)
  async userDetail(@Param("id", ParseUUIDPipe) id: string) {
    const user = await this.prisma.client.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true, email: true, phone: true, role: true, status: true, emailVerified: true,
        phoneVerified: true, lastLoginAt: true, createdAt: true, updatedAt: true, profile: true,
        memberships: { include: { organization: { select: { id: true, name: true, status: true } } } },
        candidateApplications: {
          orderBy: { createdAt: "desc" }, take: 50,
          select: { id: true, status: true, submittedAt: true, scholarship: { select: { id: true, title: true } } },
        },
        refreshTokens: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true, createdAt: true, expiresAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException("Không tìm thấy người dùng");
    const [logs, notes] = await Promise.all([
      this.prisma.client.auditLog.findMany({
        where: { OR: [{ actorId: id }, { entityType: "User", entityId: id }] },
        orderBy: { createdAt: "desc" }, take: 100,
        select: { id: true, action: true, entityType: true, entityId: true, metadata: true, reason: true, createdAt: true },
      }),
      this.prisma.client.adminNote.findMany({
        where: { entityType: "User", entityId: id }, orderBy: { createdAt: "desc" },
      }),
    ]);
    return { ...user, logs, notes };
  }

  @Post("users/:id/actions")
  @RequirePermissions(PERMISSIONS.USER_SUSPEND)
  async userAction(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UserActionDto,
    @Req() request: AdminRequest,
  ) {
    if (id === request.user.sub && ["SUSPEND", "CHANGE_ROLE", "SOFT_DELETE"].includes(body.action)) {
      throw new BadRequestException("Không thể tự khóa, xóa hoặc hạ vai trò của chính mình");
    }
    if (["SUSPEND", "CHANGE_ROLE", "SOFT_DELETE"].includes(body.action) && !body.reason?.trim()) {
      throw new BadRequestException("Hành động này bắt buộc nhập lý do");
    }
    const result = await this.prisma.client.$transaction(async (tx) => {
      const current = await tx.user.findFirst({ where: { id, deletedAt: null } });
      if (!current) throw new NotFoundException("Không tìm thấy người dùng");
      if (current.role === "SUPER_ADMIN" && (body.action === "SOFT_DELETE" || (body.action === "CHANGE_ROLE" && body.role !== "SUPER_ADMIN"))) {
        const total = await tx.user.count({ where: { role: "SUPER_ADMIN", deletedAt: null, status: { not: "DISABLED" } } });
        if (total <= 1) throw new BadRequestException("Không thể hạ quyền SUPER_ADMIN cuối cùng");
      }
      if (body.action === "CHANGE_ROLE" && request.user.role !== "SUPER_ADMIN") {
        throw new BadRequestException("Chỉ SUPER_ADMIN được thay đổi vai trò quản trị");
      }
      let data: Prisma.UserUpdateInput = {};
      if (body.action === "SUSPEND") data = { status: "SUSPENDED" };
      if (body.action === "ACTIVATE") data = { status: "ACTIVE" };
      if (body.action === "CHANGE_ROLE") {
        if (!body.role) throw new BadRequestException("Thiếu vai trò mới");
        data = { role: body.role };
      }
      if (body.action === "SOFT_DELETE") data = { status: "DISABLED", deletedAt: new Date() };
      const updated = Object.keys(data).length ? await tx.user.update({
        where: { id }, data,
        select: { id: true, email: true, role: true, status: true, deletedAt: true },
      }) : { id: current.id, email: current.email, role: current.role, status: current.status, deletedAt: current.deletedAt };
      if (["FORCE_LOGOUT", "SUSPEND", "SOFT_DELETE"].includes(body.action)) {
        await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      await tx.auditLog.create({
        data: {
          actorId: request.user.sub, action: "ADMIN_USER_UPDATED", entityType: "User", entityId: id,
          reason: body.reason, metadata: { action: body.action, before: { role: current.role, status: current.status }, after: updated },
        },
      });
      return updated;
    });
    if (body.action === "RESEND_VERIFICATION" || body.action === "SEND_PASSWORD_RESET") {
      if (result.email) {
        await this.mail.sendMail({
          to: result.email,
          subject: body.action === "RESEND_VERIFICATION" ? "Xác minh tài khoản TopScholar" : "Đặt lại mật khẩu TopScholar",
          text: body.action === "RESEND_VERIFICATION"
            ? "Vui lòng mở TopScholar để hoàn tất xác minh tài khoản."
            : "Một yêu cầu đặt lại mật khẩu đã được tạo. Vui lòng mở TopScholar để tiếp tục.",
        }).catch(() => undefined);
      }
    }
    return result;
  }

  @Post("users/:id/notes")
  @RequirePermissions(PERMISSIONS.USER_READ)
  addUserNote(@Param("id", ParseUUIDPipe) id: string, @Body() body: AdminNoteDto, @Req() request: AdminRequest) {
    return this.prisma.client.adminNote.create({
      data: { entityType: "User", entityId: id, authorId: request.user.sub, content: body.content },
    });
  }

  @Get("applications")
  @RequirePermissions(PERMISSIONS.APPLICATION_READ)
  async applications(@Query() query: ApplicationAdminQueryDto) {
    const where: Prisma.ApplicationWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.scholarshipId ? { scholarshipId: query.scholarshipId } : {}),
      ...(query.organizationId ? { scholarship: { organizationId: query.organizationId } } : {}),
      ...(query.dateFrom || query.dateTo ? { submittedAt: {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      } } : {}),
      ...(query.gpaFrom !== undefined || query.gpaTo !== undefined ? { candidate: { profile: { gpa: {
        ...(query.gpaFrom !== undefined ? { gte: query.gpaFrom } : {}),
        ...(query.gpaTo !== undefined ? { lte: query.gpaTo } : {}),
      } } } } : {}),
      ...(query.query ? { OR: [
        { candidate: { email: { contains: query.query, mode: "insensitive" } } },
        { candidate: { profile: { fullName: { contains: query.query, mode: "insensitive" } } } },
        { scholarship: { title: { contains: query.query, mode: "insensitive" } } },
      ] } : {}),
    };
    const [items, total, counts] = await this.prisma.client.$transaction([
      this.prisma.client.application.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
        select: {
          id: true, status: true, submittedAt: true, createdAt: true, riskFlags: true,
          candidate: { select: { id: true, email: true, profile: { select: { fullName: true, gpa: true } } } },
          scholarship: { select: { id: true, title: true, organization: { select: { id: true, name: true } } } },
          reviewer: { select: { id: true, email: true } }, _count: { select: { documents: true } },
        },
      }),
      this.prisma.client.application.count({ where }),
      this.prisma.client.application.groupBy({ by: ["status"], where: { deletedAt: null }, orderBy: { status: "asc" }, _count: true }),
    ]);
    return {
      items, counts: Object.fromEntries(counts.map((item) => [item.status, item._count])),
      pagination: this.pagination(query.page, query.pageSize, total),
    };
  }

  @Get("applications/:id")
  @RequirePermissions(PERMISSIONS.APPLICATION_READ)
  async applicationDetail(@Param("id", ParseUUIDPipe) id: string) {
    const item = await this.prisma.client.application.findFirst({
      where: { id, deletedAt: null },
      include: {
        candidate: { select: { id: true, email: true, phone: true, profile: true } },
        scholarship: { include: { organization: { select: { id: true, name: true } } } },
        reviewer: { select: { id: true, email: true } },
        documents: true,
        statusHistory: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { id: true, email: true } } } },
      },
    });
    if (!item) throw new NotFoundException("Không tìm thấy hồ sơ");
    const [documents, recentApplicationCount, duplicateDocuments] = await Promise.all([
      Promise.all(item.documents.map(async ({ storageKey, ...document }) => ({
        ...document,
        signedUrl: await this.storage.signedDownloadUrl(storageKey).catch(() => null),
      }))),
      this.prisma.client.application.count({
        where: {
          candidateId: item.candidateId,
          id: { not: item.id },
          submittedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          deletedAt: null,
        },
      }),
      item.documents.length
        ? this.prisma.client.applicationDocument.findMany({
          where: {
            applicationId: { not: item.id },
            storageKey: { in: item.documents.map((document) => document.storageKey) },
          },
          select: { fileName: true, storageKey: true, applicationId: true },
        })
        : Promise.resolve([]),
    ]);
    const detectedRiskFlags = [
      ...(recentApplicationCount >= 5 ? [{ code: "HIGH_SUBMISSION_VELOCITY", count: recentApplicationCount + 1, windowHours: 24 }] : []),
      ...(duplicateDocuments.length ? [{ code: "DUPLICATE_DOCUMENT", matches: duplicateDocuments }] : []),
    ];
    return { ...item, documents, detectedRiskFlags };
  }

  @Post("applications/:id/status")
  @RequirePermissions(PERMISSIONS.APPLICATION_REVIEW)
  async applicationStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ApplicationDecisionDto,
    @Req() request: AdminRequest,
  ) {
    const result = await this.prisma.client.$transaction(async (tx) => {
      const current = await tx.application.findFirst({
        where: { id, deletedAt: null },
        include: { candidate: { select: { email: true } }, scholarship: { select: { title: true, createdById: true } } },
      });
      if (!current) throw new NotFoundException("Không tìm thấy hồ sơ");
      const updated = await tx.application.update({
        where: { id }, data: { status: body.status, reviewerId: request.user.sub, adminNote: body.reason },
      });
      await tx.applicationStatusHistory.create({
        data: { applicationId: id, fromStatus: current.status, toStatus: body.status, changedById: request.user.sub, note: body.reason },
      });
      await tx.notification.createMany({ data: [
        { userId: current.candidateId, type: "APPLICATION_STATUS", priority: "HIGH", title: "Hồ sơ đã cập nhật trạng thái", body: `${current.scholarship.title}: ${body.status}`, actionUrl: `/applications/${id}` },
        { userId: current.scholarship.createdById, type: "APPLICATION_STATUS", priority: "NORMAL", title: "Admin đã can thiệp hồ sơ", body: `${current.scholarship.title}: ${body.status}` },
      ] });
      await tx.auditLog.create({
        data: {
          actorId: request.user.sub, action: "ADMIN_APPLICATION_STATUS_CHANGED", entityType: "Application", entityId: id,
          reason: body.reason, metadata: { before: current.status, after: body.status },
        },
      });
      return { updated, email: current.candidate.email, title: current.scholarship.title };
    });
    if (result.email) await this.mail.sendMail({
      to: result.email, subject: "Cập nhật hồ sơ TopScholar",
      text: `Hồ sơ ${result.title} đã chuyển sang trạng thái ${body.status}. Lý do: ${body.reason}`,
    }).catch(() => undefined);
    return result.updated;
  }

  @Get("consulting")
  @RequirePermissions(PERMISSIONS.CONSULTING_REPLY)
  async consulting(@Query() query: ConsultQueryDto) {
    const where: Prisma.ConsultRequestWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.query ? { OR: [
        { subject: { contains: query.query, mode: "insensitive" } },
        { guestEmail: { contains: query.query, mode: "insensitive" } },
        { requester: { email: { contains: query.query, mode: "insensitive" } } },
      ] } : {}),
    };
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.consultRequest.findMany({
        where, orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        skip: (query.page - 1) * query.pageSize, take: query.pageSize,
        include: {
          requester: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
          assignee: { select: { id: true, email: true } }, _count: { select: { messages: true } },
        },
      }),
      this.prisma.client.consultRequest.count({ where }),
    ]);
    return { items, pagination: this.pagination(query.page, query.pageSize, total) };
  }

  @Get("consulting/templates")
  @RequirePermissions(PERMISSIONS.CONSULTING_REPLY)
  consultingTemplates() {
    return this.prisma.client.replyTemplate.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  }

  @Get("consulting/:id")
  @RequirePermissions(PERMISSIONS.CONSULTING_REPLY)
  async consultingDetail(@Param("id", ParseUUIDPipe) id: string) {
    const item = await this.prisma.client.consultRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        requester: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
        assignee: { select: { id: true, email: true } },
        scholarship: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, email: true } } } },
      },
    });
    if (!item) throw new NotFoundException("Không tìm thấy yêu cầu tư vấn");
    return item;
  }

  @Patch("consulting/:id")
  @RequirePermissions(PERMISSIONS.CONSULTING_REPLY)
  async updateConsulting(@Param("id", ParseUUIDPipe) id: string, @Body() body: ConsultUpdateDto, @Req() request: AdminRequest) {
    const updated = await this.prisma.client.consultRequest.update({
      where: { id }, data: {
        status: body.status, priority: body.priority, assigneeId: body.assigneeId,
        resolvedAt: body.status === "RESOLVED" || body.status === "CLOSED" ? new Date() : undefined,
      },
    });
    await this.audit(request, "ADMIN_CONSULT_UPDATED", "ConsultRequest", id, body);
    return updated;
  }

  @Post("consulting/:id/messages")
  @RequirePermissions(PERMISSIONS.CONSULTING_REPLY)
  async replyConsulting(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ConsultMessageDto,
    @Req() request: AdminRequest,
  ) {
    const result = await this.prisma.client.$transaction(async (tx) => {
      const current = await tx.consultRequest.findUnique({
        where: { id }, include: { requester: { select: { email: true } } },
      });
      if (!current) throw new NotFoundException("Không tìm thấy yêu cầu tư vấn");
      const message = await tx.consultMessage.create({
        data: { requestId: id, authorId: request.user.sub, content: body.content, internal: body.internal },
      });
      await tx.consultRequest.update({
        where: { id }, data: {
          assigneeId: current.assigneeId ?? request.user.sub,
          status: body.internal ? current.status : "WAITING",
          firstRespondedAt: body.internal ? current.firstRespondedAt : current.firstRespondedAt ?? new Date(),
        },
      });
      return { message, email: current.requester?.email ?? current.guestEmail };
    });
    if (!body.internal && result.email) await this.mail.sendMail({
      to: result.email, subject: "TopScholar đã trả lời yêu cầu tư vấn", text: body.content,
    }).catch(() => undefined);
    await this.audit(request, "ADMIN_CONSULT_UPDATED", "ConsultRequest", id, { reply: true, internal: body.internal });
    return result.message;
  }

  @Get("content/posts")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async posts(@Query() query: PageQueryDto) {
    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(query.query ? { OR: [
        { title: { contains: query.query, mode: "insensitive" } },
        { slug: { contains: query.query, mode: "insensitive" } },
      ] } : {}),
    };
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.post.findMany({
        where, orderBy: { updatedAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
        select: { id: true, title: true, slug: true, status: true, category: true, scheduledAt: true, publishedAt: true, viewCount: true, updatedAt: true },
      }),
      this.prisma.client.post.count({ where }),
    ]);
    return { items, pagination: this.pagination(query.page, query.pageSize, total) };
  }

  @Get("content/posts/:id")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async postDetail(@Param("id", ParseUUIDPipe) id: string) {
    const post = await this.prisma.client.post.findFirst({
      where: { id, deletedAt: null }, include: { revisions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!post) throw new NotFoundException("Không tìm thấy bài viết");
    return post;
  }

  @Post("content/posts")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async createPost(@Body() body: PostUpsertDto, @Req() request: AdminRequest) {
    const slug = body.slug?.trim() || this.slugify(body.title);
    const created = await this.prisma.client.post.create({
      data: {
        ...body, slug, authorId: request.user.sub,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        publishedAt: body.status === "PUBLISHED" ? new Date() : null,
      },
    });
    await this.prisma.client.postRevision.create({ data: { postId: created.id, snapshot: created as unknown as Prisma.InputJsonValue } });
    await this.audit(request, "ADMIN_CONTENT_UPDATED", "Post", created.id, { action: "CREATE", status: created.status });
    return created;
  }

  @Put("content/posts/:id")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async updatePost(@Param("id", ParseUUIDPipe) id: string, @Body() body: PostUpsertDto, @Req() request: AdminRequest) {
    const current = await this.prisma.client.post.findFirst({ where: { id, deletedAt: null } });
    if (!current) throw new NotFoundException("Không tìm thấy bài viết");
    const updated = await this.prisma.client.$transaction(async (tx) => {
      await tx.postRevision.create({ data: { postId: id, snapshot: current as unknown as Prisma.InputJsonValue } });
      return tx.post.update({ where: { id }, data: {
        ...body, slug: body.slug?.trim() || this.slugify(body.title),
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        publishedAt: body.status === "PUBLISHED" ? current.publishedAt ?? new Date() : current.publishedAt,
      } });
    });
    await this.audit(request, "ADMIN_CONTENT_UPDATED", "Post", id, { action: "UPDATE", before: current.status, after: updated.status });
    return updated;
  }

  @Get("content/banners")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  banners() {
    return this.prisma.client.banner.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" } });
  }

  @Post("content/banners")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async createBanner(@Body() body: BannerUpsertDto, @Req() request: AdminRequest) {
    const item = await this.prisma.client.banner.create({ data: {
      ...body,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    } });
    await this.audit(request, "ADMIN_CONTENT_UPDATED", "Banner", item.id, { action: "CREATE" });
    return item;
  }

  @Put("content/banners/reorder")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async reorderBanners(@Body() body: IdsDto, @Req() request: AdminRequest) {
    const existing = await this.prisma.client.banner.count({
      where: { id: { in: body.ids }, deletedAt: null },
    });
    if (existing !== body.ids.length) throw new BadRequestException("Danh sách banner không hợp lệ");
    await this.prisma.client.$transaction(
      body.ids.map((id, sortOrder) => this.prisma.client.banner.update({
        where: { id },
        data: { sortOrder },
      })),
    );
    await this.audit(request, "ADMIN_CONTENT_UPDATED", "Banner", null, {
      action: "REORDER",
      ids: body.ids,
    });
    return this.banners();
  }

  @Put("content/banners/:id")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async updateBanner(@Param("id", ParseUUIDPipe) id: string, @Body() body: BannerUpsertDto, @Req() request: AdminRequest) {
    const item = await this.prisma.client.banner.update({ where: { id }, data: {
      ...body,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    } });
    await this.audit(request, "ADMIN_CONTENT_UPDATED", "Banner", id, { action: "UPDATE" });
    return item;
  }

  @Put("content/featured/reorder")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async reorderFeatured(@Body() body: IdsDto, @Req() request: AdminRequest) {
    const existing = await this.prisma.client.scholarship.count({
      where: { id: { in: body.ids }, deletedAt: null, status: "PUBLISHED" },
    });
    if (existing !== body.ids.length) throw new BadRequestException("Danh sách học bổng không hợp lệ");
    await this.prisma.client.$transaction(
      body.ids.map((id, featuredOrder) => this.prisma.client.scholarship.update({
        where: { id },
        data: { isFeatured: true, featuredOrder },
      })),
    );
    await this.audit(request, "ADMIN_CONTENT_UPDATED", "Scholarship", null, {
      action: "REORDER_FEATURED",
      ids: body.ids,
    });
    return { success: true, ids: body.ids };
  }

  @Get("content/pages")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  pages() {
    return this.prisma.client.staticPage.findMany({ orderBy: { key: "asc" } });
  }

  @Put("content/pages/:key")
  @RequirePermissions(PERMISSIONS.CONTENT_MANAGE)
  async updatePage(@Param("key") key: string, @Body() body: StaticPageUpsertDto, @Req() request: AdminRequest) {
    if (key !== body.key) throw new BadRequestException("Khóa trang không khớp");
    const item = await this.prisma.client.staticPage.upsert({
      where: { key },
      create: { ...body, publishedAt: body.status === "PUBLISHED" ? new Date() : null },
      update: { title: body.title, content: body.content, status: body.status, publishedAt: body.status === "PUBLISHED" ? new Date() : null },
    });
    await this.audit(request, "ADMIN_CONTENT_UPDATED", "StaticPage", item.id, { action: "UPDATE", key });
    return item;
  }

  @Get("settings/taxonomies")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  async taxonomies() {
    const items = await this.prisma.client.taxonomy.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });
    return Promise.all(items.map(async (item) => ({ ...item, usageCount: await this.taxonomyUsage(item.type, item.name) })));
  }

  @Post("settings/taxonomies")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  async createTaxonomy(@Body() body: TaxonomyUpsertDto, @Req() request: AdminRequest) {
    const slug = body.slug || this.slugify(body.name);
    const item = await this.prisma.client.$transaction(async (tx) => {
      const taxonomy = await tx.taxonomy.create({ data: { ...body, slug } });
      if (body.type === "MAJOR") await tx.major.upsert({ where: { slug }, create: { name: body.name, slug }, update: { name: body.name } });
      return taxonomy;
    });
    await this.audit(request, "ADMIN_SETTINGS_UPDATED", "Taxonomy", item.id, { action: "CREATE", type: item.type });
    return item;
  }

  @Put("settings/taxonomies/:id")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  async updateTaxonomy(@Param("id", ParseUUIDPipe) id: string, @Body() body: TaxonomyUpsertDto, @Req() request: AdminRequest) {
    const item = await this.prisma.client.$transaction(async (tx) => {
      const current = await tx.taxonomy.findUnique({ where: { id } });
      if (!current) throw new NotFoundException("Không tìm thấy danh mục");
      const slug = body.slug || this.slugify(body.name);
      const taxonomy = await tx.taxonomy.update({ where: { id }, data: { ...body, slug } });
      if (current.type === "MAJOR") {
        const major = await tx.major.findUnique({ where: { slug: current.slug } });
        if (major) await tx.major.update({ where: { id: major.id }, data: { name: body.name, slug } });
      }
      return taxonomy;
    });
    await this.audit(request, "ADMIN_SETTINGS_UPDATED", "Taxonomy", id, { action: "UPDATE" });
    return item;
  }

  @Delete("settings/taxonomies/:id")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  async deleteTaxonomy(@Param("id", ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    const item = await this.prisma.client.taxonomy.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Không tìm thấy danh mục");
    const usageCount = await this.taxonomyUsage(item.type, item.name);
    if (usageCount > 0) throw new BadRequestException(`Danh mục đang được dùng bởi ${usageCount} bản ghi`);
    const children = await this.prisma.client.taxonomy.count({ where: { parentId: id } });
    if (children) throw new BadRequestException(`Danh mục đang có ${children} mục con`);
    await this.prisma.client.$transaction(async (tx) => {
      if (item.type === "MAJOR") await tx.major.deleteMany({ where: { slug: item.slug } });
      await tx.taxonomy.delete({ where: { id } });
    });
    await this.audit(request, "ADMIN_SETTINGS_UPDATED", "Taxonomy", id, { action: "DELETE" });
    return { success: true };
  }

  @Post("settings/taxonomies/merge")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  async mergeTaxonomy(@Body() body: TaxonomyMergeDto, @Req() request: AdminRequest) {
    if (body.sourceId === body.targetId) throw new BadRequestException("Danh mục nguồn và đích phải khác nhau");
    const result = await this.prisma.client.$transaction(async (tx) => {
      const [source, target] = await Promise.all([
        tx.taxonomy.findUnique({ where: { id: body.sourceId } }),
        tx.taxonomy.findUnique({ where: { id: body.targetId } }),
      ]);
      if (!source || !target || source.type !== target.type) throw new BadRequestException("Danh mục không hợp lệ hoặc khác loại");
      if (source.type === "COUNTRY") await tx.scholarship.updateMany({ where: { country: source.name }, data: { country: target.name } });
      if (source.type === "REGION") await tx.scholarship.updateMany({ where: { region: source.name }, data: { region: target.name } });
      if (source.type === "EDUCATION_LEVEL") await tx.scholarship.updateMany({ where: { degreeLevel: source.name }, data: { degreeLevel: target.name } });
      if (source.type === "MAJOR") {
        const [sourceMajor, targetMajor] = await Promise.all([
          tx.major.findUnique({ where: { slug: source.slug } }),
          tx.major.findUnique({ where: { slug: target.slug } }),
        ]);
        if (sourceMajor && targetMajor) {
          const relations = await tx.scholarshipMajor.findMany({ where: { majorId: sourceMajor.id } });
          for (const relation of relations) {
            await tx.scholarshipMajor.upsert({
              where: { scholarshipId_majorId: { scholarshipId: relation.scholarshipId, majorId: targetMajor.id } },
              create: { scholarshipId: relation.scholarshipId, majorId: targetMajor.id },
              update: {},
            });
          }
          await tx.scholarshipMajor.deleteMany({ where: { majorId: sourceMajor.id } });
          await tx.major.delete({ where: { id: sourceMajor.id } });
        }
      }
      await tx.taxonomy.updateMany({ where: { parentId: source.id }, data: { parentId: target.id } });
      await tx.taxonomy.delete({ where: { id: source.id } });
      return { source, target };
    });
    await this.audit(request, "ADMIN_SETTINGS_UPDATED", "Taxonomy", body.targetId, { action: "MERGE", sourceId: body.sourceId });
    return { success: true, target: result.target };
  }

  @Get("settings/system")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  systemSettingsList(@Query() query: SettingsQueryDto) {
    return this.systemSettings.getAdminSettings(query.group);
  }

  @Put("settings/system")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  async updateSystemSettings(@Body() body: SettingsDto, @Req() request: AdminRequest) {
    const result = await this.systemSettings.updateAdminSettings(body.values, body.clearSecrets);
    await this.redis.client.del("settings:all").catch(() => 0);
    await this.audit(request, "ADMIN_SETTINGS_UPDATED", "SystemSetting", null, {
      keys: result.changedKeys,
      clearedSecretKeys: result.clearedSecretKeys,
    });
    return { success: true, ...result };
  }

  @Post("settings/system/test-email")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  async testSystemEmail(@Body() body: EmailTestDto, @Req() request: AdminRequest) {
    await this.mail.sendMail({
      to: body.recipient,
      subject: "[TopScholar] Kiểm tra cấu hình email",
      html: "<p>Email kiểm tra từ trang Cấu hình Email & Thông báo của TopScholar.</p>",
    });
    await this.audit(request, "ADMIN_EMAIL_TEST_SENT", "SystemSetting", null, {
      recipientDomain: body.recipient.split("@")[1] ?? "unknown",
    });
    return { success: true };
  }

  @Get("settings/team")
  @RequirePermissions(PERMISSIONS.ADMIN_MANAGE)
  team() {
    return this.prisma.client.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"] }, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true, profile: { select: { fullName: true } } },
    });
  }

  @Post("settings/team")
  @RequirePermissions(PERMISSIONS.ADMIN_MANAGE)
  async inviteTeamMember(@Body() body: TeamInviteDto, @Req() request: AdminRequest) {
    const email = body.email.toLowerCase();
    if (await this.prisma.client.user.findUnique({ where: { email } })) {
      throw new ConflictException("Email đã tồn tại trong hệ thống");
    }
    const temporaryPassword = `${randomBytes(12).toString("base64url")}Aa1!`;
    const user = await this.prisma.client.user.create({
      data: {
        email,
        passwordHash: await this.passwordHash.hash(temporaryPassword),
        role: body.role,
        status: "ACTIVE",
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, email: true, role: true, status: true, createdAt: true },
    });
    await this.mail.sendMail({
      to: email,
      subject: "Lời mời tham gia đội ngũ quản trị TopScholar",
      text: `Tài khoản quản trị của bạn đã được tạo. Mật khẩu tạm thời: ${temporaryPassword}. Hãy đăng nhập và đổi mật khẩu ngay.`,
    }).catch(() => undefined);
    await this.audit(request, "ADMIN_SETTINGS_UPDATED", "User", user.id, { action: "TEAM_INVITE", role: body.role });
    return user;
  }

  @Patch("settings/team/:id")
  @RequirePermissions(PERMISSIONS.ADMIN_MANAGE)
  async updateTeamRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: TeamRoleDto,
    @Req() request: AdminRequest,
  ) {
    if (id === request.user.sub) throw new BadRequestException("Không thể tự đổi vai trò của chính mình");
    const updated = await this.prisma.client.$transaction(async (tx) => {
      const current = await tx.user.findFirst({ where: { id, deletedAt: null } });
      if (!current) throw new NotFoundException("Không tìm thấy thành viên");
      if (current.role === "SUPER_ADMIN" && body.role !== "SUPER_ADMIN") {
        const count = await tx.user.count({ where: { role: "SUPER_ADMIN", status: "ACTIVE", deletedAt: null } });
        if (count <= 1) throw new BadRequestException("Không thể hạ quyền SUPER_ADMIN cuối cùng");
      }
      return tx.user.update({
        where: { id },
        data: { role: body.role },
        select: { id: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true },
      });
    });
    await this.audit(request, "ADMIN_SETTINGS_UPDATED", "User", id, { action: "TEAM_ROLE", role: body.role });
    return updated;
  }

  @Delete("settings/team/:id")
  @RequirePermissions(PERMISSIONS.ADMIN_MANAGE)
  async revokeTeamMember(@Param("id", ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    if (id === request.user.sub) throw new BadRequestException("Không thể tự thu hồi quyền của chính mình");
    await this.prisma.client.$transaction(async (tx) => {
      const current = await tx.user.findFirst({ where: { id, deletedAt: null } });
      if (!current) throw new NotFoundException("Không tìm thấy thành viên");
      if (current.role === "SUPER_ADMIN") {
        const count = await tx.user.count({ where: { role: "SUPER_ADMIN", status: "ACTIVE", deletedAt: null } });
        if (count <= 1) throw new BadRequestException("Không thể thu hồi SUPER_ADMIN cuối cùng");
      }
      await tx.user.update({ where: { id }, data: { status: "DISABLED" } });
      await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    });
    await this.audit(request, "ADMIN_SETTINGS_UPDATED", "User", id, { action: "TEAM_REVOKE" });
    return { success: true };
  }

  @Get("settings/emails")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  emailTemplates() {
    return this.prisma.client.emailTemplate.findMany({
      orderBy: { key: "asc" },
      include: { revisions: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
  }

  @Put("settings/emails/:id")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  async updateEmailTemplate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: EmailTemplateDto,
    @Req() request: AdminRequest,
  ) {
    const item = await this.prisma.client.$transaction(async (tx) => {
      const current = await tx.emailTemplate.findUnique({ where: { id } });
      if (!current) throw new NotFoundException("Không tìm thấy mẫu email");
      await tx.emailTemplateRevision.create({
        data: { templateId: id, subject: current.subject, content: current.content, editorId: request.user.sub },
      });
      return tx.emailTemplate.update({ where: { id }, data: body });
    });
    await this.audit(request, "ADMIN_SETTINGS_UPDATED", "EmailTemplate", id, { action: "UPDATE" });
    return item;
  }

  @Post("settings/emails/:id/test")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  async testEmailTemplate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: EmailTestDto,
    @Req() request: AdminRequest,
  ) {
    const template = await this.prisma.client.emailTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException("Không tìm thấy mẫu email");
    await this.mail.sendMail({ to: body.recipient, subject: `[TEST] ${template.subject}`, html: template.content });
    await this.audit(request, "ADMIN_EMAIL_TEST_SENT", "EmailTemplate", id, { recipient: body.recipient });
    return { success: true };
  }

  @Get("settings/profile")
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  async adminProfile(@Req() request: AdminRequest) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: request.user.sub },
      select: {
        id: true, email: true, phone: true, role: true, status: true, lastLoginAt: true, totpEnabled: true, profile: true,
        refreshTokens: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true, createdAt: true, expiresAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) throw new NotFoundException("Không tìm thấy tài khoản");
    return user;
  }

  @Delete("settings/profile/sessions/:id")
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  revokeSession(@Param("id", ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    return this.prisma.client.refreshToken.updateMany({
      where: { id, userId: request.user.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  @Post("settings/profile/password")
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  async changePassword(@Body() body: PasswordChangeDto, @Req() request: AdminRequest) {
    const user = await this.prisma.client.user.findUnique({ where: { id: request.user.sub } });
    if (!user || !(await this.passwordHash.verify(user.passwordHash, body.currentPassword))) {
      throw new BadRequestException("Mật khẩu hiện tại không đúng");
    }
    const passwordHash = await this.passwordHash.hash(body.newPassword);
    await this.prisma.client.$transaction([
      this.prisma.client.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.client.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.client.auditLog.create({
        data: {
          actorId: user.id,
          action: "ADMIN_PROFILE_SECURITY_UPDATED",
          entityType: "User",
          entityId: user.id,
          metadata: { action: "PASSWORD_CHANGED" },
        },
      }),
    ]);
    return { success: true, reloginRequired: true };
  }

  @Post("settings/profile/2fa/setup")
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  async setupTwoFactor(@Req() request: AdminRequest) {
    const user = await this.prisma.client.user.findUnique({ where: { id: request.user.sub } });
    if (!user?.email) throw new BadRequestException("Tài khoản cần có email");
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, "TopScholar Admin", secret);
    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { totpSecret: secret, totpEnabled: false },
    });
    return { secret, otpauthUrl, qrCodeDataUrl: await QRCode.toDataURL(otpauthUrl) };
  }

  @Post("settings/profile/2fa/enable")
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  async enableTwoFactor(@Body() body: TotpVerifyDto, @Req() request: AdminRequest) {
    const user = await this.prisma.client.user.findUnique({ where: { id: request.user.sub } });
    if (!user?.totpSecret || !authenticator.check(body.token, user.totpSecret)) {
      throw new BadRequestException("Mã xác thực không đúng");
    }
    await this.prisma.client.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
    await this.audit(request, "ADMIN_PROFILE_SECURITY_UPDATED", "User", user.id, { action: "TOTP_ENABLED" });
    return { success: true };
  }

  @Delete("settings/profile/2fa")
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  async disableTwoFactor(@Body() body: TotpVerifyDto, @Req() request: AdminRequest) {
    const user = await this.prisma.client.user.findUnique({ where: { id: request.user.sub } });
    if (!user?.totpSecret || !authenticator.check(body.token, user.totpSecret)) {
      throw new BadRequestException("Mã xác thực không đúng");
    }
    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null },
    });
    await this.audit(request, "ADMIN_PROFILE_SECURITY_UPDATED", "User", user.id, { action: "TOTP_DISABLED" });
    return { success: true };
  }

  @Get("notifications")
  @RequirePermissions(PERMISSIONS.NOTIFICATION_READ)
  async notifications(@Query() query: NotificationQueryDto, @Req() request: AdminRequest) {
    const where: Prisma.NotificationWhereInput = {
      userId: request.user.sub,
      ...(query.type ? { type: query.type } : {}),
      ...(query.unread ? { readAt: null } : {}),
    };
    const [items, total, unread] = await this.prisma.client.$transaction([
      this.prisma.client.notification.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      }),
      this.prisma.client.notification.count({ where }),
      this.prisma.client.notification.count({ where: { userId: request.user.sub, readAt: null } }),
    ]);
    return { items, unread, pagination: this.pagination(query.page, query.pageSize, total) };
  }

  @Get("notifications/preferences")
  @RequirePermissions(PERMISSIONS.NOTIFICATION_READ)
  async notificationPreferences(@Req() request: AdminRequest) {
    const items = await this.prisma.client.notificationPreference.findMany({
      where: { userId: request.user.sub },
      orderBy: { type: "asc" },
    });
    return Object.fromEntries(items.map((item) => [item.type, item.email]));
  }

  @Put("notifications/preferences")
  @RequirePermissions(PERMISSIONS.NOTIFICATION_READ)
  async updateNotificationPreferences(
    @Body() body: NotificationPreferencesDto,
    @Req() request: AdminRequest,
  ) {
    const entries = Object.entries(body.emailByType);
    await this.prisma.client.$transaction(entries.map(([type, email]) =>
      this.prisma.client.notificationPreference.upsert({
        where: { userId_type: { userId: request.user.sub, type } },
        create: { userId: request.user.sub, type, email },
        update: { email },
      })));
    await this.audit(request, "ADMIN_NOTIFICATION_UPDATED", "NotificationPreference", null, { types: entries.map(([type]) => type) });
    return { success: true };
  }

  @Post("notifications/:id/read")
  @RequirePermissions(PERMISSIONS.NOTIFICATION_READ)
  readNotification(@Param("id", ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    return this.prisma.client.notification.updateMany({ where: { id, userId: request.user.sub }, data: { readAt: new Date() } });
  }

  @Post("notifications/read-all")
  @RequirePermissions(PERMISSIONS.NOTIFICATION_READ)
  readAllNotifications(@Req() request: AdminRequest) {
    return this.prisma.client.notification.updateMany({ where: { userId: request.user.sub, readAt: null }, data: { readAt: new Date() } });
  }

  @Get("trash")
  @RequirePermissions(PERMISSIONS.TRASH_MANAGE)
  async trash() {
    const [users, organizations, scholarships, applications, consults, posts, banners] = await this.prisma.client.$transaction([
      this.prisma.client.user.findMany({ where: { deletedAt: { not: null } }, select: { id: true, email: true, deletedAt: true }, take: 100 }),
      this.prisma.client.organization.findMany({ where: { deletedAt: { not: null } }, select: { id: true, name: true, deletedAt: true }, take: 100 }),
      this.prisma.client.scholarship.findMany({ where: { deletedAt: { not: null } }, select: { id: true, title: true, deletedAt: true }, take: 100 }),
      this.prisma.client.application.findMany({ where: { deletedAt: { not: null } }, select: { id: true, deletedAt: true }, take: 100 }),
      this.prisma.client.consultRequest.findMany({ where: { deletedAt: { not: null } }, select: { id: true, subject: true, deletedAt: true }, take: 100 }),
      this.prisma.client.post.findMany({ where: { deletedAt: { not: null } }, select: { id: true, title: true, deletedAt: true }, take: 100 }),
      this.prisma.client.banner.findMany({ where: { deletedAt: { not: null } }, select: { id: true, title: true, deletedAt: true }, take: 100 }),
    ]);
    const pack = <T extends { id: string; deletedAt: Date | null }>(entityType: TrashActionDto["entityType"], items: T[], label: (item: T) => string) =>
      items.map((item) => ({ id: item.id, entityType, label: label(item), deletedAt: item.deletedAt }));
    return [
      ...pack("User", users, (item) => item.email ?? item.id),
      ...pack("Organization", organizations, (item) => item.name),
      ...pack("Scholarship", scholarships, (item) => item.title),
      ...pack("Application", applications, (item) => item.id),
      ...pack("ConsultRequest", consults, (item) => item.subject),
      ...pack("Post", posts, (item) => item.title),
      ...pack("Banner", banners, (item) => item.title),
    ].sort((a, b) => Number(b.deletedAt) - Number(a.deletedAt));
  }

  @Post("trash/restore")
  @RequirePermissions(PERMISSIONS.TRASH_MANAGE)
  async restoreTrash(@Body() body: TrashActionDto, @Req() request: AdminRequest) {
    await this.setDeletedAt(body, null);
    await this.audit(request, "ADMIN_TRASH_RESTORED", body.entityType, body.id, {});
    return { success: true };
  }

  @Post("trash/purge")
  @RequirePermissions(PERMISSIONS.ADMIN_MANAGE)
  async purgeTrash(@Body() body: TrashActionDto, @Req() request: AdminRequest) {
    await this.deletePermanently(body);
    await this.audit(request, "ADMIN_TRASH_PURGED", body.entityType, body.id, {});
    return { success: true };
  }

  @Get("reports")
  @RequirePermissions(PERMISSIONS.REPORT_MANAGE)
  reports() {
    return this.prisma.client.abuseReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, email: true } },
        scholarship: { select: { id: true, title: true } },
      },
    });
  }

  @Patch("reports/:id")
  @RequirePermissions(PERMISSIONS.REPORT_MANAGE)
  async updateReport(@Param("id", ParseUUIDPipe) id: string, @Body() body: ReportUpdateDto, @Req() request: AdminRequest) {
    const updated = await this.prisma.client.abuseReport.update({
      where: { id }, data: {
        status: body.status, resolution: body.resolution, assigneeId: request.user.sub,
        resolvedAt: body.status === "RESOLVED" || body.status === "DISMISSED" ? new Date() : null,
      },
    });
    await this.audit(request, "ADMIN_REPORT_UPDATED", "AbuseReport", id, body);
    return updated;
  }

  @Get("system/health")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  async health() {
    const startedAt = Date.now();
    const [database, applicationStorage, organizationStorage] = await Promise.all([
      this.prisma.client.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`
        .then(() => ({ status: "up", latencyMs: Date.now() - startedAt }))
        .catch((error: Error) => ({ status: "down", error: error.message })),
      this.prisma.client.applicationDocument.aggregate({ _sum: { size: true }, _count: true }),
      this.prisma.client.organizationDocument.aggregate({ _sum: { size: true }, _count: true }),
    ]);
    const redisStarted = Date.now();
    const redis = await this.redis.client.ping()
      .then(() => ({ status: "up", latencyMs: Date.now() - redisStarted }))
      .catch((error: Error) => ({ status: "down", error: error.message }));
    return {
      database, redis,
      storage: {
        status: this.config.get<string>("storage.bucket") ? "configured" : "not_configured",
        usedBytes: (applicationStorage._sum.size ?? 0) + (organizationStorage._sum.size ?? 0),
        objectCount: applicationStorage._count + organizationStorage._count,
      },
      version: process.env.npm_package_version ?? "0.1.0",
      uptimeSeconds: Math.floor(process.uptime()),
      checkedAt: new Date(),
    };
  }

  @Get("system/jobs")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  async jobs() {
    const [counts, jobs, reportSchedules] = await Promise.all([
      this.notifyQueue.getJobCounts("waiting", "active", "failed", "delayed", "completed"),
      this.notifyQueue.getJobs(["waiting", "active", "failed", "delayed"], 0, 199, true),
      this.prisma.client.reportSchedule.count({ where: { active: true } }),
    ]);
    const items = await Promise.all(jobs.map(async (job) => ({
      id: String(job.id),
      name: job.name,
      state: await job.getState(),
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason || null,
      timestamp: job.timestamp,
      processedOn: job.processedOn ?? null,
      finishedOn: job.finishedOn ?? null,
    })));
    return {
      items,
      provider: "BullMQ",
      queue: NOTIFY_QUEUE_NAME,
      counts,
      cron: [
        { name: "trash-purge", schedule: "03:00 mỗi ngày", active: true },
        { name: "scheduled-report", schedule: "mỗi giờ", active: true, pendingSchedules: reportSchedules },
      ],
      note: "Payload OTP không được trả về giao diện quản trị.",
    };
  }

  @Post("system/jobs/:id/retry")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  async retryJob(@Param("id") id: string) {
    const job = await this.notifyQueue.getJob(id);
    if (!job) throw new NotFoundException("Không tìm thấy job");
    if (await job.isFailed()) await job.retry("failed");
    return { success: true, id };
  }

  @Post("system/jobs/retry")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  async retryJobs(@Body() body: JobIdsDto) {
    const results = await Promise.all(body.ids.map(async (id) => {
      const job = await this.notifyQueue.getJob(id);
      if (!job || !(await job.isFailed())) return { id, retried: false };
      await job.retry("failed");
      return { id, retried: true };
    }));
    return { results };
  }

  @Get("system/emails-sent")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  emailsSent() {
    return this.prisma.client.emailDelivery.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  }

  @Post("system/emails-sent/:id/resend")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  async resendEmail(@Param("id", ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    const current = await this.prisma.client.emailDelivery.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Không tìm thấy email");
    try {
      await this.mail.sendMail({
        to: current.recipient,
        subject: current.subject,
        text: "Email được gửi lại từ Trung tâm vận hành TopScholar.",
      });
      const updated = await this.prisma.client.emailDelivery.update({
        where: { id },
        data: { status: "SENT", sentAt: new Date(), errorMessage: null },
      });
      await this.audit(request, "ADMIN_EMAIL_TEST_SENT", "EmailDelivery", id, { action: "RESEND" });
      return updated;
    } catch (error) {
      await this.prisma.client.emailDelivery.update({
        where: { id },
        data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Unknown error" },
      });
      throw new BadRequestException("Gửi lại email thất bại");
    }
  }

  @Post("system/emails-test")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  async testEmail(@Body() body: EmailTestDto, @Req() request: AdminRequest) {
    const delivery = await this.prisma.client.emailDelivery.create({
      data: { recipient: body.recipient, type: "ADMIN_TEST", subject: "Kiểm tra email TopScholar" },
    });
    try {
      await this.mail.sendMail({ to: body.recipient, subject: delivery.subject, text: "Email kiểm tra từ Admin TopScholar." });
      await this.prisma.client.emailDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", sentAt: new Date() } });
    } catch (error) {
      await this.prisma.client.emailDelivery.update({
        where: { id: delivery.id }, data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Unknown error" },
      });
    }
    await this.audit(request, "ADMIN_EMAIL_TEST_SENT", "EmailDelivery", delivery.id, { recipient: body.recipient });
    return this.prisma.client.emailDelivery.findUnique({ where: { id: delivery.id } });
  }

  @Get("analytics")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  async analytics() {
    const [
      users,
      scholarships,
      applications,
      organizations,
      cohorts,
      organizationApproval,
      topScholarships,
      trafficSources,
      schedules,
    ] = await Promise.all([
      this.prisma.client.user.groupBy({ by: ["role"], where: { deletedAt: null }, orderBy: { role: "asc" }, _count: true }),
      this.prisma.client.scholarship.groupBy({ by: ["status"], where: { deletedAt: null }, orderBy: { status: "asc" }, _count: true }),
      this.prisma.client.application.groupBy({ by: ["status"], where: { deletedAt: null }, orderBy: { status: "asc" }, _count: true }),
      this.prisma.client.organization.findMany({
        where: { deletedAt: null }, orderBy: { scholarships: { _count: "desc" } }, take: 20,
        select: { id: true, name: true, status: true, _count: { select: { scholarships: true } } },
      }),
      this.prisma.client.$queryRaw<Array<{ cohort: string; registered: number; applied: number; conversionPct: number }>>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', u."createdAt"), 'YYYY-MM') AS cohort,
          COUNT(DISTINCT u.id)::int AS registered,
          COUNT(DISTINCT a."candidateId")::int AS applied,
          ROUND(
            COUNT(DISTINCT a."candidateId")::numeric * 100 /
            NULLIF(COUNT(DISTINCT u.id), 0),
            2
          )::float8 AS "conversionPct"
        FROM "User" u
        LEFT JOIN "Application" a ON a."candidateId" = u.id AND a."deletedAt" IS NULL
        WHERE u.role = 'CANDIDATE' AND u."deletedAt" IS NULL
        GROUP BY DATE_TRUNC('month', u."createdAt")
        ORDER BY DATE_TRUNC('month', u."createdAt") DESC
        LIMIT 12
      `,
      this.prisma.client.$queryRaw<Array<{ id: string; name: string; total: number; approved: number; approvalPct: number }>>`
        SELECT
          o.id,
          o.name,
          COUNT(s.id)::int AS total,
          COUNT(s.id) FILTER (WHERE s.status = 'PUBLISHED')::int AS approved,
          ROUND(
            COUNT(s.id) FILTER (WHERE s.status = 'PUBLISHED')::numeric * 100 /
            NULLIF(COUNT(s.id), 0),
            2
          )::float8 AS "approvalPct"
        FROM "Organization" o
        LEFT JOIN "Scholarship" s ON s."organizationId" = o.id AND s."deletedAt" IS NULL
        WHERE o."deletedAt" IS NULL
        GROUP BY o.id, o.name
        ORDER BY approved DESC, total DESC
        LIMIT 20
      `,
      this.prisma.client.scholarship.findMany({
        where: { deletedAt: null },
        orderBy: [{ viewCount: "desc" }, { applications: { _count: "desc" } }],
        take: 10,
        select: {
          id: true,
          title: true,
          viewCount: true,
          _count: { select: { applications: true, savedBy: true } },
        },
      }),
      this.prisma.client.analyticsEvent.groupBy({
        by: ["source"],
        where: { source: { not: null } },
        _count: true,
        orderBy: { _count: { source: "desc" } },
        take: 20,
      }),
      this.prisma.client.reportSchedule.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    return {
      users,
      scholarships,
      applications,
      organizations,
      cohorts,
      organizationApproval,
      topScholarships,
      trafficSources,
      schedules,
      generatedAt: new Date(),
    };
  }

  @Post("analytics/schedules")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  async createReportSchedule(@Body() body: ReportScheduleDto, @Req() request: AdminRequest) {
    const item = await this.prisma.client.reportSchedule.create({
      data: {
        recipient: body.recipient.toLowerCase(),
        frequency: body.frequency,
        active: body.active,
        nextRunAt: this.nextReportRun(body.frequency),
        createdById: request.user.sub,
      },
    });
    await this.audit(request, "ADMIN_REPORT_SCHEDULE_UPDATED", "ReportSchedule", item.id, {
      action: "CREATE",
      frequency: body.frequency,
    });
    return item;
  }

  @Patch("analytics/schedules/:id")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  async updateReportSchedule(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReportScheduleDto,
    @Req() request: AdminRequest,
  ) {
    const item = await this.prisma.client.reportSchedule.update({
      where: { id },
      data: {
        recipient: body.recipient.toLowerCase(),
        frequency: body.frequency,
        active: body.active,
        nextRunAt: this.nextReportRun(body.frequency),
      },
    });
    await this.audit(request, "ADMIN_REPORT_SCHEDULE_UPDATED", "ReportSchedule", id, {
      action: "UPDATE",
      frequency: body.frequency,
      active: body.active,
    });
    return item;
  }

  @Delete("analytics/schedules/:id")
  @RequirePermissions(PERMISSIONS.SYSTEM_READ)
  async deleteReportSchedule(@Param("id", ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    await this.prisma.client.reportSchedule.delete({ where: { id } });
    await this.audit(request, "ADMIN_REPORT_SCHEDULE_UPDATED", "ReportSchedule", id, { action: "DELETE" });
    return { success: true };
  }

  private pagination(page: number, pageSize: number, total: number) {
    return { page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
  }

  private slugify(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  private parseSetting(value: string) {
    try { return JSON.parse(value) as unknown; } catch { return value; }
  }

  private nextReportRun(frequency: "DAILY" | "WEEKLY" | "MONTHLY", from = new Date()) {
    const next = new Date(from);
    next.setMinutes(0, 0, 0);
    if (frequency === "DAILY") next.setDate(next.getDate() + 1);
    if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
    if (frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
    return next;
  }

  private async audit(
    request: AdminRequest,
    action: "ADMIN_USER_UPDATED" | "ADMIN_APPLICATION_STATUS_CHANGED" | "ADMIN_CONSULT_UPDATED" | "ADMIN_CONTENT_UPDATED" | "ADMIN_SETTINGS_UPDATED" | "ADMIN_NOTIFICATION_UPDATED" | "ADMIN_TRASH_RESTORED" | "ADMIN_TRASH_PURGED" | "ADMIN_REPORT_UPDATED" | "ADMIN_EMAIL_TEST_SENT" | "ADMIN_PROFILE_SECURITY_UPDATED" | "ADMIN_REPORT_SCHEDULE_UPDATED",
    entityType: string,
    entityId: string | null,
    metadata: unknown,
  ) {
    await this.prisma.client.auditLog.create({
      data: { actorId: request.user.sub, action, entityType, entityId, metadata: metadata as Prisma.InputJsonValue },
    });
  }

  private async taxonomyUsage(type: string, name: string) {
    if (type === "COUNTRY") return this.prisma.client.scholarship.count({ where: { country: name, deletedAt: null } });
    if (type === "REGION") return this.prisma.client.scholarship.count({ where: { region: name, deletedAt: null } });
    if (type === "EDUCATION_LEVEL") return this.prisma.client.scholarship.count({ where: { degreeLevel: name, deletedAt: null } });
    if (type === "MAJOR") {
      const major = await this.prisma.client.major.findFirst({
        where: { name },
        select: { _count: { select: { scholarships: true } } },
      });
      return major?._count.scholarships ?? 0;
    }
    return 0;
  }

  private setDeletedAt(body: TrashActionDto, value: Date | null) {
    if (body.entityType === "User") return this.prisma.client.user.update({ where: { id: body.id }, data: { deletedAt: value, ...(value === null ? { status: "ACTIVE" as const } : {}) } });
    if (body.entityType === "Organization") return this.prisma.client.organization.update({ where: { id: body.id }, data: { deletedAt: value } });
    if (body.entityType === "Scholarship") return this.prisma.client.scholarship.update({ where: { id: body.id }, data: { deletedAt: value } });
    if (body.entityType === "Application") return this.prisma.client.application.update({ where: { id: body.id }, data: { deletedAt: value } });
    if (body.entityType === "ConsultRequest") return this.prisma.client.consultRequest.update({ where: { id: body.id }, data: { deletedAt: value } });
    if (body.entityType === "Post") return this.prisma.client.post.update({ where: { id: body.id }, data: { deletedAt: value } });
    return this.prisma.client.banner.update({ where: { id: body.id }, data: { deletedAt: value } });
  }

  private deletePermanently(body: TrashActionDto) {
    if (body.entityType === "User") return this.prisma.client.user.delete({ where: { id: body.id } });
    if (body.entityType === "Organization") return this.prisma.client.organization.delete({ where: { id: body.id } });
    if (body.entityType === "Scholarship") return this.prisma.client.scholarship.delete({ where: { id: body.id } });
    if (body.entityType === "Application") return this.prisma.client.application.delete({ where: { id: body.id } });
    if (body.entityType === "ConsultRequest") return this.prisma.client.consultRequest.delete({ where: { id: body.id } });
    if (body.entityType === "Post") return this.prisma.client.post.delete({ where: { id: body.id } });
    return this.prisma.client.banner.delete({ where: { id: body.id } });
  }
}
