import { NextRequest } from "next/server";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { SmsService } from "@/services/sms.service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds

/**
 * Auto-Campaign Scheduler Cron Job
 * Runs weekly (every Monday at 10 AM) to automatically send
 * recurring engagement campaigns to opted-in customers.
 *
 * Campaign types:
 * 1. Monthly Engagement — one promotional tip/reminder per month to all opted-in SMS customers
 * 2. Welcome Follow-up — one-time follow-up 3 days after initial welcome message
 * 3. Re-engagement — reach out to inactive customers (no orders in 30+ days), once per month
 * 4. Loyalty Milestone — congratulate customers approaching tier upgrades, once per month
 *
 * All campaigns are limited to ONCE PER MONTH to avoid spamming customers.
 * Uses SmsCampaign records to track what's been sent (prevents duplicates).
 * Schedule: Weekly on Mondays at 10 AM (vercel.json)
 */

// Rotating weekly engagement messages
const WEEKLY_MESSAGES = [
  "Hi {name}! 💇‍♀️ Stop by this week for the latest styles & products. Show this text for 10% off any service! — {org}",
  "Hey {name}! ✨ New products just dropped! Come check them out. Your loyalty points are working for you 💰 — {org}",
  "Hi {name}! 🎉 Reminder: You have {points} loyalty points! Visit us to earn more & unlock exclusive rewards — {org}",
  "Hey {name}! 💅 Treat yourself this week! We have specials on select services. Reply STOP to opt out — {org}",
  "Hi {name}! 🌟 We miss you! Come in this week for a fresh look. Loyalty members get double points on Wednesdays — {org}",
  "Hey {name}! 💐 Your beauty routine deserves an upgrade. Book your appointment today! — {org}",
  "Hi {name}! 🔥 Hot deals this week! Check out our newest arrivals in-store. Your {points} points are waiting — {org}",
  "Hey {name}! 💎 Exclusive for loyalty members: early access to this week's specials. See you soon! — {org}",
];

const WELCOME_FOLLOWUP_MESSAGE =
  "Hi {name}! 👋 Just checking in — have you had a chance to explore your loyalty rewards? You can track your {points} points & redeem rewards anytime. Questions? Just reply! — {org}";

const REENGAGEMENT_MESSAGE =
  "Hi {name}! 💭 We haven't seen you in a while & we miss you! Come back this week and earn double loyalty points on your visit. — {org}";

const MILESTONE_MESSAGES: Record<string, string> = {
  SILVER:
    "Hi {name}! 🥈 You're almost at Silver tier! Just {needed} more points to unlock 10% off all purchases. Keep earning! — {org}",
  GOLD: "Hi {name}! 🥇 You're close to Gold tier! Only {needed} more points for 15% off everything + exclusive perks. — {org}",
  PLATINUM:
    "Hi {name}! 💎 Platinum is within reach! Just {needed} more points for 20% off + VIP treatment. Almost there! — {org}",
};

function formatMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  let msg = template;
  for (const [key, value] of Object.entries(vars)) {
    msg = msg.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return msg;
}

export const GET = withWebhookHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || cronSecret.length < 16) {
      return apiError("Server misconfigured", { status: 500, requestId });
    }

    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const { timingSafeEqual } = await import("@/lib/env");
    if (!timingSafeEqual(token, cronSecret)) {
      return apiUnauthorized(requestId);
    }

    // Check Twilio credentials
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      return apiSuccess(
        { skipped: true, reason: "Twilio not configured" },
        { requestId },
      );
    }

    const now = new Date();
    const results: Record<string, { sent: number; failed: number }> = {};

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    for (const org of organizations) {
      // Find org admin for createdById
      const admin = await prisma.user.findFirst({
        where: { organizationId: org.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!admin) continue;

      // ── 1. MONTHLY ENGAGEMENT ─────────────────────────────────────────
      const monthlyResult = await sendMonthlyEngagement(
        org,
        admin.id,
        now,
      );
      results[`${org.name}_monthly`] = monthlyResult;

      // ── 2. WELCOME FOLLOW-UP (3 days after welcome) ───────────────────
      const followUpResult = await sendWelcomeFollowUp(org, admin.id, now);
      results[`${org.name}_followup`] = followUpResult;

      // ── 3. RE-ENGAGEMENT (inactive 30+ days) ─────────────────────────
      const reengageResult = await sendReengagement(org, admin.id, now);
      results[`${org.name}_reengage`] = reengageResult;

      // ── 4. LOYALTY MILESTONE ──────────────────────────────────────────
      const milestoneResult = await sendMilestoneReminders(org, admin.id, now);
      results[`${org.name}_milestone`] = milestoneResult;
    }

    logger.info("Auto-campaign scheduler completed", {
      route: "auto-campaigns",
      data: results,
    });

    return apiSuccess(
      {
        timestamp: now.toISOString(),
        results,
      },
      { requestId },
    );
  },
  { route: "GET /api/cron/auto-campaigns" },
);

// ─── CAMPAIGN FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Monthly engagement SMS — one rotating message per month to all opted-in customers
 */
async function sendMonthlyEngagement(
  org: { id: string; name: string },
  adminId: string,
  now: Date,
) {
  let sent = 0;
  let failed = 0;

  // Only send once per month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const existing = await prisma.smsCampaign.findFirst({
    where: {
      organizationId: org.id,
      name: { startsWith: "Auto: Monthly" },
      createdAt: { gte: monthStart },
    },
  });

  if (existing) {
    return { sent: 0, failed: 0, skipped: "Already sent this month" };
  }

  // Pick message based on month number (rotates through 8 messages)
  const monthNumber = now.getMonth();
  const messageTemplate = WEEKLY_MESSAGES[monthNumber % WEEKLY_MESSAGES.length];

  // Get all SMS-opted-in customers with phone
  const customers = await prisma.customer.findMany({
    where: {
      organizationId: org.id,
      phone: { not: null },
      smsOptIn: true,
    },
    select: {
      id: true,
      phone: true,
      firstName: true,
      loyaltyPoints: true,
    },
    take: 500, // Limit per run
  });

  if (customers.length === 0) {
    return { sent: 0, failed: 0, skipped: "No eligible customers" };
  }

  // Create the campaign record
  const campaign = await prisma.smsCampaign.create({
    data: {
      name: `Auto: Monthly Engagement ${now.toISOString().slice(0, 7)}`,
      message: messageTemplate,
      type: "REGULAR",
      status: "SENDING",
      organizationId: org.id,
      createdById: adminId,
      totalRecipients: customers.length,
    },
  });

  // Send to each customer
  for (const customer of customers) {
    try {
      const message = formatMessage(messageTemplate, {
        name: customer.firstName || "Friend",
        org: org.name || "Bogolo",
        points: customer.loyaltyPoints || 0,
      });

      await SmsService.send({
        to: customer.phone!,
        message,
        organizationId: org.id,
        userId: adminId,
        campaignId: campaign.id,
      });
      sent++;
    } catch {
      failed++;
    }

    // Rate limit: 100ms between sends
    await new Promise((r) => setTimeout(r, 100));
  }

  // Update campaign status
  await prisma.smsCampaign.update({
    where: { id: campaign.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      totalRecipients: customers.length,
      deliveredCount: sent,
      failedCount: failed,
    },
  });

  return { sent, failed };
}

/**
 * Welcome follow-up — one-time send 3+ days after the initial welcome message.
 * Only sends once per month per org, and only to customers who haven't received a follow-up yet.
 */
async function sendWelcomeFollowUp(
  org: { id: string; name: string },
  adminId: string,
  now: Date,
) {
  let sent = 0;
  let failed = 0;

  // Only run once per month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const existingCampaign = await prisma.smsCampaign.findFirst({
    where: {
      organizationId: org.id,
      name: { startsWith: "Auto: Welcome Follow-up" },
      createdAt: { gte: monthStart },
    },
  });

  if (existingCampaign) {
    return { sent: 0, failed: 0, skipped: "Already sent follow-ups this month" };
  }

  // Find customers who got welcome 3+ days ago but never received a follow-up
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const customers = await prisma.customer.findMany({
    where: {
      organizationId: org.id,
      welcomeSentAt: { not: null, lte: threeDaysAgo }, // Got welcome 3+ days ago
      phone: { not: null },
      smsOptIn: true,
      // Never received a follow-up message
      smsMessages: {
        none: {
          direction: "OUTBOUND",
          message: { contains: "checking in" },
        },
      },
    },
    select: {
      id: true,
      phone: true,
      firstName: true,
      loyaltyPoints: true,
    },
    take: 50,
  });

  if (customers.length === 0) return { sent: 0, failed: 0 };

  // Create campaign record to prevent re-runs this month
  const followUpCampaign = await prisma.smsCampaign.create({
    data: {
      name: `Auto: Welcome Follow-up ${now.toISOString().slice(0, 7)}`,
      message: WELCOME_FOLLOWUP_MESSAGE,
      type: "REGULAR",
      status: "SENDING",
      organizationId: org.id,
      createdById: adminId,
      totalRecipients: customers.length,
    },
  });

  for (const customer of customers) {
    try {
      const message = formatMessage(WELCOME_FOLLOWUP_MESSAGE, {
        name: customer.firstName || "Friend",
        org: org.name || "Bogolo",
        points: customer.loyaltyPoints || 0,
      });

      await SmsService.send({
        to: customer.phone!,
        message,
        organizationId: org.id,
        userId: adminId,
        campaignId: followUpCampaign.id,
      });
      sent++;
    } catch {
      failed++;
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  await prisma.smsCampaign.update({
    where: { id: followUpCampaign.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      deliveredCount: sent,
      failedCount: failed,
    },
  });

  return { sent, failed };
}

/**
 * Re-engagement — reach out to customers inactive for 30+ days
 */
async function sendReengagement(
  org: { id: string; name: string },
  adminId: string,
  now: Date,
) {
  let sent = 0;
  let failed = 0;

  // Only run re-engagement once per month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const existing = await prisma.smsCampaign.findFirst({
    where: {
      organizationId: org.id,
      name: { startsWith: "Auto: Re-engagement" },
      createdAt: { gte: monthStart },
    },
  });

  if (existing) {
    return { sent: 0, failed: 0, skipped: "Already sent this month" };
  }

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Customers who haven't ordered in 30-90 days but have ordered before
  const customers = await prisma.customer.findMany({
    where: {
      organizationId: org.id,
      phone: { not: null },
      smsOptIn: true,
      orderCount: { gt: 0 },
      lastOrderAt: {
        gte: ninetyDaysAgo,
        lte: thirtyDaysAgo,
      },
      // No recent outbound SMS in last 7 days
      smsMessages: {
        none: {
          direction: "OUTBOUND",
          sentAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
    },
    select: {
      id: true,
      phone: true,
      firstName: true,
    },
    take: 100,
  });

  if (customers.length === 0) return { sent: 0, failed: 0 };

  const campaign = await prisma.smsCampaign.create({
    data: {
      name: `Auto: Re-engagement ${now.toISOString().slice(0, 7)}`,
      message: REENGAGEMENT_MESSAGE,
      type: "REGULAR",
      status: "SENDING",
      organizationId: org.id,
      createdById: adminId,
      totalRecipients: customers.length,
    },
  });

  for (const customer of customers) {
    try {
      const message = formatMessage(REENGAGEMENT_MESSAGE, {
        name: customer.firstName || "Friend",
        org: org.name || "Bogolo",
      });

      await SmsService.send({
        to: customer.phone!,
        message,
        organizationId: org.id,
        userId: adminId,
        campaignId: campaign.id,
      });
      sent++;
    } catch {
      failed++;
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  await prisma.smsCampaign.update({
    where: { id: campaign.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      deliveredCount: sent,
      failedCount: failed,
    },
  });

  return { sent, failed };
}

/**
 * Loyalty milestone reminders — notify customers close to the next tier
 */
async function sendMilestoneReminders(
  org: { id: string; name: string },
  adminId: string,
  now: Date,
) {
  let sent = 0;
  let failed = 0;

  // Only run milestone checks once per month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const existingMilestone = await prisma.smsCampaign.findFirst({
    where: {
      organizationId: org.id,
      name: { startsWith: "Auto: Milestone" },
      createdAt: { gte: monthStart },
    },
  });

  if (existingMilestone) {
    return { sent: 0, failed: 0, skipped: "Already sent milestones this month" };
  }

  // Get tier thresholds
  const tiers = await prisma.loyaltyTier.findMany({
    where: { organizationId: org.id },
    orderBy: { minPoints: "asc" },
  });

  if (tiers.length === 0) return { sent: 0, failed: 0 };

  // Build tier thresholds map
  const tierThresholds: { name: string; minPoints: number }[] = tiers.map(
    (t) => ({
      name: t.name,
      minPoints: t.minPoints,
    }),
  );

  // Get loyalty members with phone & SMS opt-in
  const members = await prisma.customer.findMany({
    where: {
      organizationId: org.id,
      loyaltyMember: true,
      phone: { not: null },
      smsOptIn: true,
    },
    select: {
      id: true,
      phone: true,
      firstName: true,
      loyaltyPoints: true,
      loyaltyTier: true,
    },
    take: 200,
  });

  for (const member of members) {
    // Find member's current tier index
    const currentTierIdx = tierThresholds.findIndex(
      (t) => t.name === member.loyaltyTier,
    );
    const nextTier = tierThresholds[currentTierIdx + 1];

    if (!nextTier) continue; // Already at highest tier

    const pointsNeeded = nextTier.minPoints - (member.loyaltyPoints || 0);

    // Only notify if within 30% of next tier
    if (pointsNeeded <= 0 || pointsNeeded > nextTier.minPoints * 0.3) continue;

    const template =
      MILESTONE_MESSAGES[nextTier.name] || MILESTONE_MESSAGES["SILVER"];
    if (!template) continue;

    try {
      const message = formatMessage(template, {
        name: member.firstName || "Friend",
        org: org.name || "Bogolo",
        needed: pointsNeeded,
      });

      await SmsService.send({
        to: member.phone!,
        message,
        organizationId: org.id,
        userId: adminId,
      });
      sent++;
    } catch {
      failed++;
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  return { sent, failed };
}


