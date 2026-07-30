CREATE TYPE "UserRole" AS ENUM ('CANDIDATE', 'PARTNER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DISABLED');
CREATE TYPE "AuditAction" AS ENUM (
  'REGISTER_VALIDATION_FAILED',
  'REGISTER_RATE_LIMITED',
  'REGISTER_OTP_RESENT',
  'REGISTER_CREATED',
  'REGISTER_OTP_SENT',
  'SCHOLARSHIP_CREATED',
  'SCHOLARSHIP_SUBMITTED',
  'SCHOLARSHIP_APPROVED',
  'SCHOLARSHIP_REJECTED',
  'APPLICATION_SUBMITTED',
  'APPLICATION_STATUS_CHANGED'
);
CREATE TYPE "ScholarshipStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'CLOSED', 'ARCHIVED');
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "DocumentType" AS ENUM ('CV', 'TRANSCRIPT', 'CERTIFICATE', 'RECOMMENDATION', 'OTHER');

CREATE TABLE "SystemSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'CANDIDATE',
  "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
  "emailVerifiedAt" TIMESTAMP(3),
  "phoneVerifiedAt" TIMESTAMP(3),
  "lastLoginAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Profile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fullName" TEXT,
  "phone" TEXT,
  "avatarUrl" TEXT,
  "bio" TEXT,
  "gpa" DOUBLE PRECISION,
  "educationLevel" TEXT,
  "country" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "logoUrl" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationMember" (
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "isOwner" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("organizationId", "userId")
);

CREATE TABLE "Scholarship" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "country" TEXT,
  "field" TEXT,
  "degreeLevel" TEXT,
  "amount" TEXT,
  "eligibility" JSONB,
  "requiredDocuments" JSONB,
  "deadline" TIMESTAMP(3),
  "status" "ScholarshipStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Application" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "scholarshipId" TEXT NOT NULL,
  "reviewerId" TEXT,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "coverLetter" TEXT,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationDocument" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "type" "DocumentType" NOT NULL,
  "fileName" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationStatusHistory" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "fromStatus" "ApplicationStatus",
  "toStatus" "ApplicationStatus" NOT NULL,
  "changedById" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedScholarship" (
  "userId" TEXT NOT NULL,
  "scholarshipId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedScholarship_pkey" PRIMARY KEY ("userId", "scholarshipId")
);

CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" "AuditAction" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "accountKeyHash" TEXT,
  "ipHash" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Scholarship_slug_key" ON "Scholarship"("slug");
CREATE UNIQUE INDEX "Application_candidateId_scholarshipId_key" ON "Application"("candidateId", "scholarshipId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_phone_idx" ON "User"("phone");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "Scholarship_country_field_degreeLevel_idx" ON "Scholarship"("country", "field", "degreeLevel");
CREATE INDEX "Scholarship_status_deadline_idx" ON "Scholarship"("status", "deadline");
CREATE INDEX "Application_status_scholarshipId_idx" ON "Application"("status", "scholarshipId");
CREATE INDEX "ApplicationDocument_applicationId_type_idx" ON "ApplicationDocument"("applicationId", "type");
CREATE INDEX "ApplicationStatusHistory_applicationId_createdAt_idx" ON "ApplicationStatusHistory"("applicationId", "createdAt");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
CREATE INDEX "RefreshToken_revokedAt_idx" ON "RefreshToken"("revokedAt");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_accountKeyHash_idx" ON "AuditLog"("accountKeyHash");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedScholarship" ADD CONSTRAINT "SavedScholarship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedScholarship" ADD CONSTRAINT "SavedScholarship_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
