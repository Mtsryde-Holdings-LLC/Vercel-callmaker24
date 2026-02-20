-- AlterTable
ALTER TABLE "customers" ADD COLUMN "welcomeSentAt" TIMESTAMP(3);

-- Backfill: mark existing customers who already have a portalToken as welcomed
-- This prevents the cron from re-sending welcome SMS to existing members
UPDATE "customers" SET "welcomeSentAt" = "updatedAt" WHERE "portalToken" IS NOT NULL;
