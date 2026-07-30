import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req } from "@nestjs/common";
import { IsArray, IsDateString, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { ScholarshipType } from "@scholarship/database";
import type { Prisma } from "@scholarship/database";
import type { Request } from "express";
import { Authenticated } from "../../common/auth/authenticated.decorator";
import { Public } from "../../common/auth/public.decorator";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

class ScholarshipUpsertDto {
  @IsUUID()
  organizationId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  summary!: string;

  @IsString()
  @MinLength(20)
  description!: string;

  @IsEnum(ScholarshipType)
  type!: ScholarshipType;

  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() field?: string;
  @IsOptional() @IsString() degreeLevel?: string;
  @IsOptional() @IsString() amount?: string;
  @IsOptional() @IsObject() eligibility?: Record<string, unknown>;
  @IsOptional() @IsArray() requiredDocuments?: unknown[];
  @IsOptional() @IsDateString() deadline?: string;
}

type UserRequest = Request & { user: { sub: string; role: string } };

@Controller("api/v1/scholarships")
export class ScholarshipsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  async list(@Query("page") rawPage?: string, @Query("pageSize") rawPageSize?: string, @Query("query") query?: string) {
    const page = Math.max(1, Number(rawPage) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(rawPageSize) || 20));
    const where = {
      deletedAt: null,
      status: "PUBLISHED" as const,
      ...(query ? { OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { organization: { name: { contains: query, mode: "insensitive" as const } } },
      ] } : {}),
    };
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.scholarship.findMany({
        where, orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * pageSize, take: pageSize,
        include: { organization: { select: { id: true, name: true, logoUrl: true, verified: true } } },
      }),
      this.prisma.client.scholarship.count({ where }),
    ]);
    return { items, pagination: { page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) } };
  }

  @Get(":id")
  @Public()
  async detail(@Param("id", ParseUUIDPipe) id: string) {
    const item = await this.prisma.client.scholarship.findFirst({
      where: { id, deletedAt: null, status: "PUBLISHED" },
      include: { organization: true, majors: { include: { major: true } } },
    });
    if (!item) throw new NotFoundException("Không tìm thấy học bổng");
    await this.prisma.client.scholarship.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return item;
  }

  @Post()
  @Authenticated()
  async create(@Body() body: ScholarshipUpsertDto, @Req() request: UserRequest) {
    await this.assertVerifiedMembership(body.organizationId, request.user.sub, request.user.role);
    const slugBase = this.slugify(body.title);
    const created = await this.prisma.client.scholarship.create({
      data: {
        ...body,
        deadline: body.deadline ? new Date(body.deadline) : null,
        eligibility: (body.eligibility ?? {}) as Prisma.InputJsonValue,
        requiredDocuments: (body.requiredDocuments ?? []) as Prisma.InputJsonValue,
        createdById: request.user.sub,
        slug: `${slugBase}-${Date.now().toString(36)}`,
      },
    });
    await this.prisma.client.auditLog.create({
      data: { actorId: request.user.sub, action: "SCHOLARSHIP_CREATED", entityType: "Scholarship", entityId: created.id },
    });
    return created;
  }

  @Patch(":id")
  @Authenticated()
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() body: ScholarshipUpsertDto, @Req() request: UserRequest) {
    const current = await this.ownedScholarship(id, request.user.sub);
    await this.assertVerifiedMembership(current.organizationId, request.user.sub, request.user.role);
    if (!["DRAFT", "REJECTED"].includes(current.status)) throw new ForbiddenException("Chỉ sửa được tin nháp hoặc bị từ chối");
    const version = await this.prisma.client.scholarshipRevision.count({ where: { scholarshipId: id } }) + 1;
    return this.prisma.client.$transaction(async (tx) => {
      await tx.scholarshipRevision.create({
        data: { scholarshipId: id, version, createdById: request.user.sub, snapshot: current },
      });
      return tx.scholarship.update({
        where: { id },
        data: {
          ...body,
          deadline: body.deadline ? new Date(body.deadline) : null,
          eligibility: (body.eligibility ?? {}) as Prisma.InputJsonValue,
          requiredDocuments: (body.requiredDocuments ?? []) as Prisma.InputJsonValue,
        },
      });
    });
  }

  @Post(":id/submit")
  @Authenticated()
  async submit(@Param("id", ParseUUIDPipe) id: string, @Req() request: UserRequest) {
    const current = await this.ownedScholarship(id, request.user.sub);
    await this.assertVerifiedMembership(current.organizationId, request.user.sub, request.user.role);
    if (!["DRAFT", "REJECTED"].includes(current.status)) throw new ForbiddenException("Tin không ở trạng thái có thể gửi duyệt");
    const updated = await this.prisma.client.scholarship.update({
      where: { id }, data: { status: "PENDING_REVIEW", submittedAt: new Date(), rejectionReason: null },
    });
    await this.prisma.client.auditLog.create({
      data: { actorId: request.user.sub, action: "SCHOLARSHIP_SUBMITTED", entityType: "Scholarship", entityId: id },
    });
    return updated;
  }

  @Post(":id/save")
  @Authenticated()
  async save(@Param("id", ParseUUIDPipe) id: string, @Req() request: UserRequest) {
    if (request.user.role !== "CANDIDATE") throw new ForbiddenException("Chỉ ứng viên được lưu học bổng");
    return this.prisma.client.savedScholarship.upsert({
      where: { userId_scholarshipId: { userId: request.user.sub, scholarshipId: id } },
      create: { userId: request.user.sub, scholarshipId: id },
      update: {},
    });
  }

  private async assertVerifiedMembership(organizationId: string, userId: string, role: string) {
    if (role !== "PARTNER") throw new ForbiddenException("Chỉ tài khoản đối tác được quản lý học bổng");
    const membership = await this.prisma.client.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: { organization: { select: { status: true, deletedAt: true } } },
    });
    if (!membership) throw new ForbiddenException("Không thuộc tổ chức này");
    if (membership.organization.status !== "VERIFIED" || membership.organization.deletedAt) {
      throw new ForbiddenException("Tổ chức phải được xác minh trước khi đăng học bổng");
    }
  }

  private async ownedScholarship(id: string, userId: string) {
    const current = await this.prisma.client.scholarship.findFirst({ where: { id, createdById: userId, deletedAt: null } });
    if (!current) throw new NotFoundException("Không tìm thấy học bổng thuộc quyền quản lý");
    return current;
  }

  private slugify(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
}
