import { BadRequestException, Body, Controller, Get, NotFoundException, Optional, Param, ParseUUIDPipe, Patch, Post, Query, Req } from "@nestjs/common";
import { PERMISSIONS } from "@scholarship/shared";
import type { Prisma } from "@scholarship/database";
import type { Request } from "express";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { MailService } from "../../infrastructure/mail/mail.service";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ScholarshipAdminQueryDto } from "./dto/scholarship-admin-query.dto";
import { ScholarshipDecision, ScholarshipDecisionDto } from "./dto/scholarship-decision.dto";
import { ScholarshipAdminUpdateDto } from "./dto/scholarship-admin-update.dto";
import { SystemSettingsService } from "../../infrastructure/settings/system-settings.service";
import { AdminMaintenanceService } from "./admin-maintenance.service";

@Controller("api/v1/admin/scholarships")
export class AdminScholarshipsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly maintenance: AdminMaintenanceService,
    @Optional() private readonly systemSettings?: SystemSettingsService,
  ) {}

  @Post("maintenance/expire")
  @RequirePermissions(PERMISSIONS.SCHOLARSHIP_APPROVE)
  expirePastDeadline() {
    return this.maintenance.expireScholarshipsPastDeadline();
  }

  @Get()
  @RequirePermissions(PERMISSIONS.SCHOLARSHIP_APPROVE)
  async list(@Query() query: ScholarshipAdminQueryDto) {
    const [yellowHours, redHours, reviewChecklist] = await Promise.all([
      this.systemSettings?.getOptionalRuntimeValue<number>("scholarship.warningYellowHours"),
      this.systemSettings?.getOptionalRuntimeValue<number>("scholarship.warningRedHours"),
      this.systemSettings?.getOptionalRuntimeValue<unknown[]>("scholarship.reviewChecklist"),
    ]);
    const where: Prisma.ScholarshipWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.query ? {
        OR: [
          { title: { contains: query.query, mode: "insensitive" } },
          { organization: { name: { contains: query.query, mode: "insensitive" } } },
        ],
      } : {}),
    };
    const [items, total, counts] = await this.prisma.client.$transaction([
      this.prisma.client.scholarship.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortDirection },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true, title: true, type: true, country: true, region: true, amount: true,
          deadline: true, status: true, viewCount: true, submittedAt: true, reviewerId: true, isFeatured: true, featuredOrder: true,
          organization: { select: { id: true, name: true, status: true, verified: true } },
          _count: { select: { applications: true } },
        },
      }),
      this.prisma.client.scholarship.count({ where }),
      this.prisma.client.scholarship.groupBy({ by: ["status"], where: { deletedAt: null }, orderBy: { status: "asc" }, _count: true }),
    ]);
    return {
      items,
      counts: Object.fromEntries(counts.map((item) => [item.status, item._count])),
      pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.max(1, Math.ceil(total / query.pageSize)) },
      configuration: {
        warningYellowHours: yellowHours ?? 24,
        warningRedHours: redHours ?? 72,
        reviewChecklist: reviewChecklist ?? [],
      },
    };
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.SCHOLARSHIP_APPROVE)
  async detail(@Param("id", ParseUUIDPipe) id: string) {
    const scholarship = await this.prisma.client.scholarship.findFirst({
      where: { id, deletedAt: null },
      include: {
        organization: { include: { members: { include: { user: { select: { id: true, email: true } } } } } },
        creator: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
        applications: {
          orderBy: { submittedAt: "desc" },
          take: 20,
          select: { id: true, status: true, submittedAt: true, candidate: { select: { id: true, email: true, profile: { select: { fullName: true } } } } },
        },
        revisions: { orderBy: { version: "desc" }, take: 2 },
      },
    });
    if (!scholarship) throw new NotFoundException("Không tìm thấy học bổng");
    const history = await this.prisma.client.auditLog.findMany({
      where: { entityType: "Scholarship", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { ...scholarship, history };
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.SCHOLARSHIP_WRITE)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ScholarshipAdminUpdateDto,
    @Req() request: Request & { user: { sub: string } },
  ) {
    const current = await this.prisma.client.scholarship.findFirst({ where: { id, deletedAt: null } });
    if (!current) throw new NotFoundException("Không tìm thấy học bổng");
    const { reason, deadline, ...data } = body;
    if (data.isFeatured && !current.isFeatured) {
      const maxFeatured = await this.systemSettings?.getOptionalRuntimeValue<number>("scholarship.maxFeatured") ?? 12;
      const featuredCount = await this.prisma.client.scholarship.count({
        where: { deletedAt: null, isFeatured: true, id: { not: id } },
      });
      if (featuredCount >= maxFeatured) {
        throw new BadRequestException(`Đã đạt giới hạn ${maxFeatured} học bổng nổi bật.`);
      }
    }
    const updated = await this.prisma.client.$transaction(async (tx) => {
      const item = await tx.scholarship.update({
        where: { id },
        data: { ...data, ...(deadline ? { deadline: new Date(deadline) } : {}) },
      });
      await tx.auditLog.create({
        data: {
          actorId: request.user.sub, action: "ADMIN_CONTENT_UPDATED", entityType: "Scholarship", entityId: id,
          reason, metadata: { before: current, after: item },
        },
      });
      return item;
    });
    return updated;
  }

  @Post(":id/decision")
  @RequirePermissions(PERMISSIONS.SCHOLARSHIP_APPROVE)
  async decide(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ScholarshipDecisionDto,
    @Req() request: Request & { user: { sub: string; role: string } },
  ) {
    if (body.decision !== ScholarshipDecision.APPROVE && !body.reason?.trim()) {
      throw new BadRequestException("Phải nhập lý do cho quyết định này");
    }
    const actorId = request.user.sub;
    const result = await this.prisma.client.$transaction(async (tx) => {
      const current = await tx.scholarship.findFirst({
        where: { id, deletedAt: null },
        include: { creator: { select: { email: true } } },
      });
      if (!current) throw new NotFoundException("Không tìm thấy học bổng");
      const status = body.decision === ScholarshipDecision.APPROVE ? "PUBLISHED"
        : body.decision === ScholarshipDecision.REMOVE ? "REMOVED"
          : body.decision === ScholarshipDecision.REQUEST_CHANGES ? "DRAFT" : "REJECTED";
      const scholarship = await tx.scholarship.update({
        where: { id },
        data: {
          status,
          reviewerId: actorId,
          publishedAt: status === "PUBLISHED" ? new Date() : current.publishedAt,
          rejectionReason: status === "PUBLISHED" ? null : body.reason,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: status === "PUBLISHED" ? "ADMIN_SCHOLARSHIP_APPROVED" : "ADMIN_SCHOLARSHIP_REJECTED",
          entityType: "Scholarship",
          entityId: id,
          metadata: { decision: body.decision, reason: body.reason, checklist: body.checklist, before: { status: current.status }, after: { status } },
        },
      });
      await tx.notification.create({
        data: {
          userId: current.createdById,
          title: status === "PUBLISHED" ? "Học bổng đã được duyệt" : "Cập nhật kiểm duyệt học bổng",
          body: `${current.title}: ${body.reason ?? "Đã được xuất bản."}`,
        },
      });
      return { scholarship, recipient: current.creator.email };
    });
    if (result.recipient) {
      void this.mail.sendMail({
        to: result.recipient,
        subject: "Kết quả kiểm duyệt học bổng",
        text: `${result.scholarship.title}: ${body.reason ?? "Đã được duyệt."}`,
      }).catch(() => undefined);
    }
    return result.scholarship;
  }
}
