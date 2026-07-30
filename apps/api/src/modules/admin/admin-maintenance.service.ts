import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { MailService } from "../../infrastructure/mail/mail.service";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { SystemSettingsService } from "../../infrastructure/settings/system-settings.service";

@Injectable()
export class AdminMaintenanceService {
  private readonly logger = new Logger(AdminMaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly systemSettings: SystemSettingsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireScholarshipsPastDeadline() {
    const graceDays = await this.systemSettings
      .getOptionalRuntimeValue<number>("scholarship.expireAfterDeadlineDays")
      .catch(() => undefined) ?? 0;
    const cutoff = new Date(Date.now() - graceDays * 24 * 60 * 60 * 1000);
    const items = await this.prisma.client.scholarship.findMany({
      where: { deletedAt: null, status: "PUBLISHED", deadline: { not: null, lte: cutoff } },
      select: { id: true, title: true, deadline: true, createdById: true },
      take: 500,
    });
    if (!items.length) return { expired: 0, cutoff: cutoff.toISOString() };

    await this.prisma.client.$transaction(async (tx) => {
      await tx.scholarship.updateMany({
        where: { id: { in: items.map((item) => item.id) }, status: "PUBLISHED" },
        data: { status: "EXPIRED", isFeatured: false },
      });
      await tx.auditLog.createMany({
        data: items.map((item) => ({
          action: "ADMIN_CONTENT_UPDATED",
          entityType: "Scholarship",
          entityId: item.id,
          reason: "Tự động hết hạn theo deadline",
          metadata: { event: "SCHOLARSHIP_AUTO_EXPIRED", deadline: item.deadline?.toISOString(), graceDays },
        })),
      });
      await tx.notification.createMany({
        data: items.map((item) => ({
          userId: item.createdById,
          type: "SCHOLARSHIP_STATUS",
          priority: "NORMAL",
          title: "Học bổng đã tự hết hạn",
          body: `${item.title} đã được chuyển sang trạng thái EXPIRED theo deadline.`,
          actionUrl: `/scholarships/${item.id}`,
        })),
      });
    });
    this.logger.log(`Đã tự hết hạn ${items.length} học bổng có deadline trước ${cutoff.toISOString()}.`);
    return { expired: items.length, cutoff: cutoff.toISOString() };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredTrash() {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.client.$transaction(async (tx) => {
      const banners = await tx.banner.deleteMany({ where: { deletedAt: { lt: cutoff } } });
      const posts = await tx.post.deleteMany({ where: { deletedAt: { lt: cutoff } } });
      const consults = await tx.consultRequest.deleteMany({ where: { deletedAt: { lt: cutoff } } });
      const applications = await tx.application.deleteMany({ where: { deletedAt: { lt: cutoff } } });
      const scholarships = await tx.scholarship.deleteMany({ where: { deletedAt: { lt: cutoff } } });
      const organizations = await tx.organization.deleteMany({ where: { deletedAt: { lt: cutoff } } });
      return { banners: banners.count, posts: posts.count, consults: consults.count, applications: applications.count, scholarships: scholarships.count, organizations: organizations.count };
    });
    if (Object.values(result).some(Boolean)) this.logger.log(`Đã tự dọn thùng rác quá 90 ngày: ${JSON.stringify(result)}`);
    return result;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sendScheduledReports() {
    const now = new Date();
    const schedules = await this.prisma.client.reportSchedule.findMany({
      where: { active: true, nextRunAt: { lte: now } },
      orderBy: { nextRunAt: "asc" },
      take: 100,
    });
    if (!schedules.length) return { processed: 0, sent: 0 };

    const [users, publishedScholarships, submittedApplications, pendingPartners] = await Promise.all([
      this.prisma.client.user.count({ where: { deletedAt: null } }),
      this.prisma.client.scholarship.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
      this.prisma.client.application.count({ where: { deletedAt: null, status: { not: "DRAFT" } } }),
      this.prisma.client.organization.count({ where: { deletedAt: null, status: "PENDING" } }),
    ]);
    const text = [
      "Báo cáo vận hành TopScholar",
      `Người dùng: ${users}`,
      `Học bổng đã xuất bản: ${publishedScholarships}`,
      `Hồ sơ đã nộp: ${submittedApplications}`,
      `Đối tác chờ KYC: ${pendingPartners}`,
      `Thời điểm tổng hợp: ${now.toISOString()}`,
    ].join("\n");

    let sent = 0;
    for (const schedule of schedules) {
      const delivery = await this.prisma.client.emailDelivery.create({
        data: {
          recipient: schedule.recipient,
          type: "SCHEDULED_ADMIN_REPORT",
          subject: `Báo cáo TopScholar ${schedule.frequency.toLowerCase()}`,
        },
      });
      try {
        await this.mail.sendMail({
          to: schedule.recipient,
          subject: delivery.subject,
          text,
        });
        await this.prisma.client.$transaction([
          this.prisma.client.emailDelivery.update({
            where: { id: delivery.id },
            data: { status: "SENT", sentAt: new Date() },
          }),
          this.prisma.client.reportSchedule.update({
            where: { id: schedule.id },
            data: { lastRunAt: now, nextRunAt: this.nextRun(schedule.frequency, now) },
          }),
        ]);
        sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await this.prisma.client.$transaction([
          this.prisma.client.emailDelivery.update({
            where: { id: delivery.id },
            data: { status: "FAILED", errorMessage: message },
          }),
          this.prisma.client.reportSchedule.update({
            where: { id: schedule.id },
            data: { lastRunAt: now, nextRunAt: this.nextRun(schedule.frequency, now) },
          }),
        ]);
        this.logger.error(`Không thể gửi báo cáo ${schedule.id}: ${message}`);
      }
    }
    return { processed: schedules.length, sent };
  }

  private nextRun(frequency: "DAILY" | "WEEKLY" | "MONTHLY", from: Date) {
    const next = new Date(from);
    next.setMinutes(0, 0, 0);
    if (frequency === "DAILY") next.setDate(next.getDate() + 1);
    if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
    if (frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
    return next;
  }
}
