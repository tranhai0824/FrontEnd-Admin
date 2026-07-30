-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_USER_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_APPLICATION_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_CONSULT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_CONTENT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_SETTINGS_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_NOTIFICATION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_TRASH_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_TRASH_PURGED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_REPORT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_EMAIL_TEST_SENT';
