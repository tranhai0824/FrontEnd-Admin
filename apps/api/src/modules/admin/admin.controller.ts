import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Optional, Param, ParseUUIDPipe, Post, Query, Req } from "@nestjs/common";
import type { Prisma } from "@scholarship/database";
import type { Request } from "express";
import { PERMISSIONS } from "@scholarship/shared";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AuditLogQueryDto } from "./dto/audit-log-query.dto";
import { BulkUserActionDto } from "./dto/bulk-user-action.dto";
import { UserListQueryDto } from "./dto/user-list-query.dto";
import { SystemSettingsService } from "../../infrastructure/settings/system-settings.service";

@Controller("api/v1/admin")
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly systemSettings?: SystemSettingsService,
  ) {}

  @Get("dashboard")
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  async dashboard(
    @Query("days") rawDays?: string,
    @Query("dateFrom") rawFrom?: string,
    @Query("dateTo") rawTo?: string,
  ) {
    const now = new Date();
    const currentTo = rawTo && !Number.isNaN(Date.parse(rawTo)) ? new Date(rawTo) : now;
    const requestedFrom = rawFrom && !Number.isNaN(Date.parse(rawFrom)) ? new Date(rawFrom) : null;
    const days = requestedFrom
      ? Math.max(1, Math.ceil((currentTo.getTime() - requestedFrom.getTime()) / 86_400_000))
      : [7, 30, 90].includes(Number(rawDays)) ? Number(rawDays) : 30;
    const currentFrom = requestedFrom ?? new Date(currentTo);
    if (!requestedFrom) currentFrom.setUTCDate(currentFrom.getUTCDate() - days);
    const previousFrom = new Date(currentFrom);
    previousFrom.setUTCDate(previousFrom.getUTCDate() - days);
    const deadlineTo = new Date(now);
    deadlineTo.setUTCDate(deadlineTo.getUTCDate() + 7);
    const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
    const yellowHours = await this.systemSettings?.getOptionalRuntimeValue<number>("scholarship.warningYellowHours") ?? 24;
    const redHours = await this.systemSettings?.getOptionalRuntimeValue<number>("scholarship.warningRedHours") ?? 72;

    const [
      totalUsers, currentUsers, previousUsers, publishedScholarships,
      currentApplications, previousApplications, verifiedOrganizations,
      pendingScholarships, overdue24h, overdue72h, pendingOrganizations,
      interventionApplications, upcomingDeadlines, topByViews, topByApplications,
      applicationStatus, scholarshipTypes, userTrend, applicationTrend,
      savedInPeriod, startedInPeriod, topOrganizations, unansweredConsulting,
      overdueConsulting, failedJobs, newReports,
    ] = await this.prisma.client.$transaction([
      this.prisma.client.user.count({ where: { deletedAt: null } }),
      this.prisma.client.user.count({ where: { deletedAt: null, createdAt: { gte: currentFrom, lte: currentTo } } }),
      this.prisma.client.user.count({ where: { deletedAt: null, createdAt: { gte: previousFrom, lt: currentFrom } } }),
      this.prisma.client.scholarship.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
      this.prisma.client.application.count({ where: { deletedAt: null, submittedAt: { gte: currentFrom, lte: currentTo } } }),
      this.prisma.client.application.count({ where: { deletedAt: null, submittedAt: { gte: previousFrom, lt: currentFrom } } }),
      this.prisma.client.organization.count({ where: { deletedAt: null, status: "VERIFIED" } }),
      this.prisma.client.scholarship.count({ where: { deletedAt: null, status: "PENDING_REVIEW" } }),
      this.prisma.client.scholarship.count({ where: { deletedAt: null, status: "PENDING_REVIEW", submittedAt: { lt: hoursAgo(yellowHours) } } }),
      this.prisma.client.scholarship.count({ where: { deletedAt: null, status: "PENDING_REVIEW", submittedAt: { lt: hoursAgo(redHours) } } }),
      this.prisma.client.organization.count({ where: { deletedAt: null, status: "PENDING" } }),
      this.prisma.client.application.count({ where: { deletedAt: null, status: "NEEDS_INTERVENTION" } }),
      this.prisma.client.scholarship.findMany({
        where: { deletedAt: null, status: "PUBLISHED", deadline: { gte: now, lte: deadlineTo } },
        orderBy: { deadline: "asc" }, take: 10,
        select: { id: true, title: true, deadline: true, organization: { select: { name: true } } },
      }),
      this.prisma.client.scholarship.findMany({
        where: { deletedAt: null }, orderBy: { viewCount: "desc" }, take: 10,
        select: { id: true, title: true, viewCount: true, _count: { select: { applications: true } } },
      }),
      this.prisma.client.scholarship.findMany({
        where: { deletedAt: null }, orderBy: { applications: { _count: "desc" } }, take: 10,
        select: { id: true, title: true, viewCount: true, _count: { select: { applications: true } } },
      }),
      this.prisma.client.$queryRaw<Array<{ name: string; value: bigint }>>`
        SELECT "status"::text AS name, COUNT(*)::bigint AS value
        FROM "Application" WHERE "deletedAt" IS NULL GROUP BY 1 ORDER BY 1`,
      this.prisma.client.$queryRaw<Array<{ name: string; value: bigint }>>`
        SELECT "type"::text AS name, COUNT(*)::bigint AS value
        FROM "Scholarship" WHERE "deletedAt" IS NULL GROUP BY 1 ORDER BY 1`,
      this.prisma.client.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "User" WHERE "deletedAt" IS NULL AND "createdAt" >= ${currentFrom} AND "createdAt" <= ${currentTo}
        GROUP BY 1 ORDER BY 1`,
      this.prisma.client.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "submittedAt") AS day, COUNT(*)::bigint AS count
        FROM "Application" WHERE "deletedAt" IS NULL AND "submittedAt" >= ${currentFrom} AND "submittedAt" <= ${currentTo}
        GROUP BY 1 ORDER BY 1`,
      this.prisma.client.savedScholarship.count({ where: { createdAt: { gte: currentFrom, lte: currentTo } } }),
      this.prisma.client.application.count({ where: { deletedAt: null, createdAt: { gte: currentFrom, lte: currentTo } } }),
      this.prisma.client.$queryRaw<Array<{ id: string; name: string; total: bigint; published: bigint; approvalRate: number }>>`
        SELECT o.id, o.name,
          COUNT(s.id)::bigint AS total,
          COUNT(s.id) FILTER (WHERE s.status = 'PUBLISHED')::bigint AS published,
          CASE WHEN COUNT(s.id) = 0 THEN 0
            ELSE ROUND((COUNT(s.id) FILTER (WHERE s.status = 'PUBLISHED')::numeric / COUNT(s.id)::numeric) * 100, 1)::float
          END AS "approvalRate"
        FROM "Organization" o
        LEFT JOIN "Scholarship" s ON s."organizationId" = o.id AND s."deletedAt" IS NULL
        WHERE o."deletedAt" IS NULL
        GROUP BY o.id, o.name
        ORDER BY total DESC, "approvalRate" DESC
        LIMIT 10`,
      this.prisma.client.consultRequest.count({ where: { deletedAt: null, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      this.prisma.client.consultRequest.count({ where: { deletedAt: null, status: { in: ["OPEN", "IN_PROGRESS"] }, slaDueAt: { lt: now } } }),
      this.prisma.client.emailDelivery.count({ where: { status: "FAILED" } }),
      this.prisma.client.abuseReport.count({ where: { status: "NEW" } }),
    ]);

    const growth = (current: number, previous: number) =>
      previous === 0 ? (current === 0 ? 0 : 100) : Math.round(((current - previous) / previous) * 1000) / 10;

    return {
      range: { days, from: currentFrom, to: currentTo },
      attention: {
        pendingScholarships, overdueScholarships24h: overdue24h, overdueScholarships72h: overdue72h,
        scholarshipWarningThresholds: { yellowHours, redHours },
        pendingOrganizations, unansweredConsulting, overdueConsulting,
        interventionApplications, failedJobs, newReports,
      },
      kpis: {
        users: { total: totalUsers, current: currentUsers, growth: growth(currentUsers, previousUsers) },
        publishedScholarships: { total: publishedScholarships, current: publishedScholarships, growth: 0 },
        applications: { total: currentApplications, current: currentApplications, growth: growth(currentApplications, previousApplications) },
        verifiedOrganizations: { total: verifiedOrganizations, current: verifiedOrganizations, growth: 0 },
      },
      trends: {
        users: userTrend.map((item) => ({ date: item.day, value: Number(item.count) })),
        applications: applicationTrend.map((item) => ({ date: item.day, value: Number(item.count) })),
      },
      distributions: {
        applicationStatus: applicationStatus.map((item) => ({ name: item.name, value: Number(item.value) })),
        scholarshipTypes: scholarshipTypes.map((item) => ({ name: item.name, value: Number(item.value) })),
      },
      funnel: {
        views: topByViews.reduce((sum, item) => sum + item.viewCount, 0),
        saves: savedInPeriod,
        started: startedInPeriod,
        submitted: currentApplications,
      },
      topScholarships: { byViews: topByViews, byApplications: topByApplications },
      topOrganizations: topOrganizations.map((item) => ({
        ...item,
        total: Number(item.total),
        published: Number(item.published),
      })),
      upcomingDeadlines,
    };
  }

  @Get("users")
  @RequirePermissions(PERMISSIONS.USER_READ)
  async users(@Query() query: UserListQueryDto) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.query ? {
        OR: [
          { email: { contains: query.query, mode: "insensitive" } },
          { phone: { contains: query.query } },
        ],
      } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.dateFrom || query.dateTo ? {
        createdAt: {
          ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
        },
      } : {}),
    };

    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.user.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortDirection },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.client.user.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  @Get("audit-logs")
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  async auditLogs(@Query() query: AuditLogQueryDto) {
    const take = query.limit ?? 50;
    const items = await this.prisma.client.auditLog.findMany({
      where: {
        ...(query.actorId ? { actorId: query.actorId } : {}),
        ...(query.action ? { action: query.action } : {}),
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
        ...(query.ipHash ? { ipHash: query.ipHash } : {}),
        ...(query.dateFrom || query.dateTo ? {
          createdAt: {
            ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
            ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
          },
        } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        actorId: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        ipHash: true,
        actor: { select: { email: true, profile: { select: { fullName: true } } } },
      },
    });

    return {
      items,
      nextCursor: items.length === take ? items.at(-1)?.id ?? null : null,
    };
  }

  @Delete("users/:id")
  @RequirePermissions(PERMISSIONS.USER_DELETE)
  async softDeleteUser(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() request: Request & { user: { sub: string; role: string } },
  ) {
    if (id === request.user.sub) throw new BadRequestException("Không thể tự xóa tài khoản đang đăng nhập");
    const result = await this.prisma.client.$transaction(async (transaction) => {
      const target = await transaction.user.findFirst({
        where: { id, deletedAt: null },
        select: { role: true },
      });
      if (!target) throw new NotFoundException("Không tìm thấy người dùng đang hoạt động");
      if (target.role === "SUPER_ADMIN") {
        const activeSuperAdmins = await transaction.user.count({
          where: { role: "SUPER_ADMIN", deletedAt: null, status: { not: "DISABLED" } },
        });
        if (activeSuperAdmins <= 1) throw new BadRequestException("Không thể xóa SUPER_ADMIN cuối cùng của hệ thống");
      }
      const updated = await transaction.user.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date(), status: "DISABLED" },
      });
      if (updated.count !== 1) throw new NotFoundException("Không tìm thấy người dùng đang hoạt động");

      await transaction.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          actorId: request.user.sub,
          action: "ADMIN_USER_SOFT_DELETED",
          entityType: "User",
          entityId: id,
          metadata: { actorRole: request.user.role },
        },
      });
      return updated;
    });

    return { success: result.count === 1 };
  }

  @Post("users/bulk-delete")
  @RequirePermissions(PERMISSIONS.USER_DELETE)
  async bulkSoftDeleteUsers(
    @Body() body: BulkUserActionDto,
    @Req() request: Request & { user: { sub: string; role: string } },
  ) {
    if (body.ids.includes(request.user.sub)) throw new BadRequestException("Danh sách không được chứa tài khoản đang đăng nhập");
    const now = new Date();
    const result = await this.prisma.client.$transaction(async (transaction) => {
      const selectedSuperAdmins = await transaction.user.count({
        where: { id: { in: body.ids }, role: "SUPER_ADMIN", deletedAt: null, status: { not: "DISABLED" } },
      });
      if (selectedSuperAdmins > 0) {
        const activeSuperAdmins = await transaction.user.count({
          where: { role: "SUPER_ADMIN", deletedAt: null, status: { not: "DISABLED" } },
        });
        if (activeSuperAdmins - selectedSuperAdmins < 1) {
          throw new BadRequestException("Không thể xóa SUPER_ADMIN cuối cùng của hệ thống");
        }
      }
      const updated = await transaction.user.updateMany({
        where: { id: { in: body.ids }, deletedAt: null },
        data: { deletedAt: now, status: "DISABLED" },
      });
      await transaction.refreshToken.updateMany({
        where: { userId: { in: body.ids }, revokedAt: null },
        data: { revokedAt: now },
      });
      await transaction.auditLog.create({
        data: {
          actorId: request.user.sub,
          action: "ADMIN_USER_SOFT_DELETED",
          entityType: "User",
          metadata: {
            actorRole: request.user.role,
            requestedIds: body.ids,
            affectedCount: updated.count,
            bulk: true,
          },
        },
      });
      return updated;
    });

    return { success: true, affectedCount: result.count };
  }
}
