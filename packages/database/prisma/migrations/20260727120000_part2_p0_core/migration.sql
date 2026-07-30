CREATE TYPE "OrganizationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_MORE_INFO', 'SUSPENDED');
CREATE TYPE "ScholarshipType" AS ENUM ('FULL', 'PARTIAL', 'GRANT', 'OTHER');

ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'REVIEWING';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'SHORTLISTED';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'NEEDS_INTERVENTION';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_SCHOLARSHIP_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_SCHOLARSHIP_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_ORGANIZATION_VERIFIED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_ORGANIZATION_REJECTED';
ALTER TYPE "ScholarshipStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "ScholarshipStatus" ADD VALUE IF NOT EXISTS 'REMOVED';

ALTER TABLE "Application" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Organization"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "normalizedName" TEXT,
  ADD COLUMN "representativeName" TEXT,
  ADD COLUMN "reviewerId" TEXT,
  ADD COLUMN "status" "OrganizationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "taxCode" TEXT,
  ADD COLUMN "type" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "website" TEXT;

UPDATE "Organization"
SET
  "normalizedName" = lower(trim("name")),
  "status" = CASE WHEN "verified" THEN 'VERIFIED'::"OrganizationStatus" ELSE 'PENDING'::"OrganizationStatus" END,
  "verifiedAt" = CASE WHEN "verified" THEN "updatedAt" ELSE NULL END,
  "submittedAt" = CASE WHEN NOT "verified" THEN "createdAt" ELSE NULL END;

ALTER TABLE "OrganizationMember"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'MEMBER';

ALTER TABLE "Scholarship"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "region" TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "reviewerId" TEXT,
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "type" "ScholarshipType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Scholarship"
SET
  "submittedAt" = CASE WHEN "status" = 'PENDING_REVIEW' THEN "updatedAt" ELSE NULL END,
  "publishedAt" = CASE WHEN "status" = 'PUBLISHED' THEN "updatedAt" ELSE NULL END;

CREATE INDEX "Application_status_submittedAt_idx" ON "Application"("status", "submittedAt");
CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");
CREATE UNIQUE INDEX "Organization_taxCode_key" ON "Organization"("taxCode");
CREATE INDEX "Organization_status_submittedAt_idx" ON "Organization"("status", "submittedAt");
CREATE INDEX "Organization_normalizedName_idx" ON "Organization"("normalizedName");
CREATE INDEX "Organization_deletedAt_idx" ON "Organization"("deletedAt");
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");
CREATE INDEX "Scholarship_status_submittedAt_idx" ON "Scholarship"("status", "submittedAt");
CREATE INDEX "Scholarship_organizationId_idx" ON "Scholarship"("organizationId");
CREATE INDEX "Scholarship_deletedAt_idx" ON "Scholarship"("deletedAt");
