-- Migration: add_organization_id_multi_tenant
-- Add organizationId columns to support multi-tenant data isolation

-- EmailCampaign
ALTER TABLE "email_campaigns" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "email_campaigns_organizationId_idx" ON "email_campaigns"("organizationId");

-- EmailMessage
ALTER TABLE "email_messages" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "email_messages_organizationId_idx" ON "email_messages"("organizationId");

-- SmsCampaign
ALTER TABLE "sms_campaigns" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "sms_campaigns" ADD CONSTRAINT "sms_campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "sms_campaigns_organizationId_idx" ON "sms_campaigns"("organizationId");

-- SmsMessage
ALTER TABLE "sms_messages" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "sms_messages_organizationId_idx" ON "sms_messages"("organizationId");

-- Call
ALTER TABLE "calls" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "calls" ADD CONSTRAINT "calls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "calls_organizationId_idx" ON "calls"("organizationId");

-- ChatConversation
ALTER TABLE "chat_conversations" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "chat_conversations_organizationId_idx" ON "chat_conversations"("organizationId");

-- IvrMenu
ALTER TABLE "ivr_menus" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "ivr_menus" ADD CONSTRAINT "ivr_menus_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ivr_menus_organizationId_idx" ON "ivr_menus"("organizationId");

-- KnowledgeBase
ALTER TABLE "knowledge_base" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "knowledge_base_organizationId_idx" ON "knowledge_base"("organizationId");

-- Integration
ALTER TABLE "integrations" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "integrations_organizationId_idx" ON "integrations"("organizationId");

-- Webhook
ALTER TABLE "webhooks" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "webhooks_organizationId_idx" ON "webhooks"("organizationId");

-- ApiKey
ALTER TABLE "api_keys" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "api_keys_organizationId_idx" ON "api_keys"("organizationId");

-- Report
ALTER TABLE "reports" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "reports" ADD CONSTRAINT "reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "reports_organizationId_idx" ON "reports"("organizationId");

-- AnalyticsEvent
ALTER TABLE "analytics_events" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "analytics_events_organizationId_idx" ON "analytics_events"("organizationId");

-- Data migration: Populate organizationId from existing user data
-- Copy organizationId from customers' creators
UPDATE "email_campaigns" ec
SET "organizationId" = u."organizationId"
FROM "users" u
WHERE ec."createdById" = u."id" AND u."organizationId" IS NOT NULL;

UPDATE "sms_campaigns" sc
SET "organizationId" = u."organizationId"
FROM "users" u
WHERE sc."createdById" = u."id" AND u."organizationId" IS NOT NULL;

-- Copy organizationId from email messages' customers
UPDATE "email_messages" em
SET "organizationId" = c."organizationId"
FROM "customers" c
WHERE em."customerId" = c."id" AND c."organizationId" IS NOT NULL;

UPDATE "sms_messages" sm
SET "organizationId" = c."organizationId"
FROM "customers" c
WHERE sm."customerId" = c."id" AND c."organizationId" IS NOT NULL;

-- Copy organizationId from calls' customers
UPDATE "calls" ca
SET "organizationId" = c."organizationId"
FROM "customers" c
WHERE ca."customerId" = c."id" AND c."organizationId" IS NOT NULL;

-- Copy organizationId from chat conversations' customers
UPDATE "chat_conversations" cc
SET "organizationId" = c."organizationId"
FROM "customers" c
WHERE cc."customerId" = c."id" AND c."organizationId" IS NOT NULL;

-- Copy organizationId from API keys' users
UPDATE "api_keys" ak
SET "organizationId" = u."organizationId"
FROM "users" u
WHERE ak."userId" = u."id" AND u."organizationId" IS NOT NULL;
