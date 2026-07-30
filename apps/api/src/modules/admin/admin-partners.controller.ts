import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Query, Req } from "@nestjs/common";
import { PERMISSIONS } from "@scholarship/shared";
import type { Prisma } from "@scholarship/database";
import type { Request } from "express";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { MailService } from "../../infrastructure/mail/mail.service";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { PartnerAdminQueryDto } from "./dto/partner-admin-query.dto";
import { PartnerDecision, PartnerDecisionDto } from "./dto/partner-decision.dto";
import { StorageService } from "../../infrastructure/storage/storage.service";

@Controller("api/v1/admin/partners")
export class AdminPartnersController {
  constructor(private readonly prisma: PrismaService, private readonly mail: MailService, private readonly storage: StorageService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ORGANIZATION_READ)
  async list(@Query() query: PartnerAdminQueryDto) {
    const where: Prisma.OrganizationWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.query ? { OR: [{ name: { contains: query.query, mode: "insensitive" } }, { taxCode: { contains: query.query } }] } : {}),
    };
    const [items, total, counts] = await this.prisma.client.$transaction([
      this.prisma.client.organization.findMany({
        where, orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
        skip: (query.page - 1) * query.pageSize, take: query.pageSize,
        select: {
          id: true, name: true, type: true, taxCode: true, representativeName: true,
          status: true, submittedAt: true, reviewerId: true,
          _count: { select: { members: true, scholarships: true, documents: true } },
        },
      }),
      this.prisma.client.organization.count({ where }),
      this.prisma.client.organization.groupBy({ by: ["status"], where: { deletedAt: null }, orderBy: { status: "asc" }, _count: true }),
    ]);
    return {
      items,
      counts: Object.fromEntries(counts.map((item) => [item.status, item._count])),
      pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.max(1, Math.ceil(total / query.pageSize)) },
    };
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.ORGANIZATION_READ)
  async detail(@Param("id", ParseUUIDPipe) id: string) {
    const organization = await this.prisma.client.organization.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: { include: { user: { select: { id: true, email: true, role: true, profile: { select: { fullName: true } } } } } },
        scholarships: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, title: true, status: true, createdAt: true } },
        documents: true,
      },
    });
    if (!organization) throw new NotFoundException("Không tìm thấy tổ chức");
    const history = await this.prisma.client.auditLog.findMany({
      where: { entityType: "Organization", entityId: id }, orderBy: { createdAt: "desc" }, take: 100,
    });
    const duplicates = await this.prisma.client.organization.findMany({
      where: {
        id: { not: id },
        deletedAt: null,
        OR: [
          ...(organization.taxCode ? [{ taxCode: organization.taxCode }] : []),
          ...(organization.normalizedName ? [{ normalizedName: organization.normalizedName }] : []),
        ],
      },
      select: { id: true, name: true, taxCode: true, status: true },
    });
    const documents = await Promise.all(organization.documents.map(async ({ storageKey, ...document }) => ({
      ...document,
      signedUrl: await this.storage.signedDownloadUrl(storageKey).catch(() => null),
    })));
    return { ...organization, documents, history, duplicates };
  }

  @Post(":id/decision")
  @RequirePermissions(PERMISSIONS.ORGANIZATION_REVIEW)
  async decide(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: PartnerDecisionDto,
    @Req() request: Request & { user: { sub: string } },
  ) {
    if (body.decision !== PartnerDecision.VERIFY && !body.reason?.trim()) {
      throw new BadRequestException("Phải nhập lý do cho quyết định này");
    }
    const actorId = request.user.sub;
    const result = await this.prisma.client.$transaction(async (tx) => {
      const current = await tx.organization.findFirst({
        where: { id, deletedAt: null },
        include: { members: { include: { user: { select: { id: true, email: true } } } } },
      });
      if (!current) throw new NotFoundException("Không tìm thấy tổ chức");
      const status = body.decision === PartnerDecision.VERIFY ? "VERIFIED"
        : body.decision === PartnerDecision.REQUEST_MORE_INFO ? "NEEDS_MORE_INFO"
          : body.decision === PartnerDecision.SUSPEND ? "SUSPENDED" : "REJECTED";
      const organization = await tx.organization.update({
        where: { id },
        data: { status, verified: status === "VERIFIED", verifiedAt: status === "VERIFIED" ? new Date() : null, reviewerId: actorId },
      });
      if (status === "SUSPENDED") {
        await tx.scholarship.updateMany({ where: { organizationId: id, status: "PUBLISHED" }, data: { status: "REMOVED" } });
      }
      await tx.auditLog.create({
        data: {
          actorId,
          action: status === "VERIFIED" ? "ADMIN_ORGANIZATION_VERIFIED" : "ADMIN_ORGANIZATION_REJECTED",
          entityType: "Organization", entityId: id,
          metadata: { decision: body.decision, reason: body.reason, before: { status: current.status }, after: { status } },
        },
      });
      if (current.members.length) {
        await tx.notification.createMany({
          data: current.members.map(({ user }) => ({
            userId: user.id,
            title: status === "VERIFIED" ? "Tổ chức đã được xác minh" : "Cập nhật xác minh tổ chức",
            body: `${current.name}: ${body.reason ?? "Đã được xác minh."}`,
          })),
        });
      }
      return { organization, emails: current.members.map(({ user }) => user.email).filter(Boolean) as string[] };
    });
    for (const email of result.emails) {
      void this.mail.sendMail({ to: email, subject: "Kết quả xác minh tổ chức", text: `${result.organization.name}: ${body.reason ?? "Đã được xác minh."}` }).catch(() => undefined);
    }
    return result.organization;
  }
}
