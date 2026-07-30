ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_REPORT_SCHEDULE_UPDATED';

CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

ALTER TABLE "Scholarship"
ADD COLUMN "featuredOrder" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "scholarshipId" TEXT,
  "eventType" TEXT NOT NULL,
  "source" TEXT,
  "sessionId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReportSchedule" (
  "id" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "frequency" "ReportFrequency" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "nextRunAt" TIMESTAMP(3) NOT NULL,
  "lastRunAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Scholarship_isFeatured_featuredOrder_idx" ON "Scholarship"("isFeatured", "featuredOrder");
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");
CREATE INDEX "AnalyticsEvent_source_createdAt_idx" ON "AnalyticsEvent"("source", "createdAt");
CREATE INDEX "AnalyticsEvent_scholarshipId_eventType_idx" ON "AnalyticsEvent"("scholarshipId", "eventType");
CREATE INDEX "ReportSchedule_active_nextRunAt_idx" ON "ReportSchedule"("active", "nextRunAt");
