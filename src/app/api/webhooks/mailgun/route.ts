import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

/**
 * Mailgun Webhook Handler
 * Processes email events from Mailgun (delivered, opened, clicked, bounced, complained)
 */

// Verify webhook signature from Mailgun
function verifyWebhookSignature(
  timestamp: string,
  token: string,
  signature: string,
): boolean {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;

  if (!signingKey) {
    logger.error("MAILGUN_WEBHOOK_SIGNING_KEY not configured", {
      route: "POST /api/webhooks/mailgun",
    });
    return false;
  }

  const encodedToken = crypto
    .createHmac("sha256", signingKey)
    .update(timestamp + token)
    .digest("hex");

  return encodedToken === signature;
}

export const POST = withWebhookHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const body = await request.json();

    // Verify webhook signature
    const signature = body.signature || {};
    const isValid = verifyWebhookSignature(
      signature.timestamp,
      signature.token,
      signature.signature,
    );

    if (!isValid) {
      return apiError("Invalid signature", { status: 401, requestId });
    }

    const eventData = body["event-data"] || {};
    const event = eventData.event || "unknown";
    const messageId = eventData.message?.headers?.["message-id"];
    const recipient = eventData.recipient;
    const timestamp = new Date(eventData.timestamp * 1000);

    // Process different event types
    switch (event) {
      case "delivered":
        await handleDelivered(messageId, recipient, eventData);
        break;

      case "opened":
        await handleOpened(messageId, recipient, eventData);
        break;

      case "clicked":
        await handleClicked(messageId, recipient, eventData);
        break;

      case "bounced":
        await handleBounced(messageId, recipient, eventData);
        break;

      case "complained":
        await handleComplained(messageId, recipient, eventData);
        break;

      case "unsubscribed":
        await handleUnsubscribed(messageId, recipient, eventData);
        break;

      case "failed":
        await handleFailed(messageId, recipient, eventData);
        break;

      default:
        break;
    }

    return apiSuccess({ success: true, event }, { requestId });
  },
  { route: "POST /api/webhooks/mailgun" },
);

// Event handlers

async function handleDelivered(
  messageId: string,
  recipient: string,
  eventData: any,
) {
  try {
    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "delivered" = "delivered" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `;

    // Log the event
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: "delivered",
        deliveredAt: new Date(eventData.timestamp * 1000),
      },
    });
  } catch (error) {
    logger.error(
      "Error handling delivered event",
      { route: "POST /api/webhooks/mailgun", messageId, recipient },
      error as Error,
    );
  }
}

async function handleOpened(
  messageId: string,
  recipient: string,
  eventData: any,
) {
  try {
    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "opened" = "opened" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `;

    // Log the open event
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: "opened",
        openedAt: new Date(eventData.timestamp * 1000),
      },
    });
  } catch (error) {
    logger.error(
      "Error handling opened event",
      { route: "POST /api/webhooks/mailgun", messageId, recipient },
      error as Error,
    );
  }
}

async function handleClicked(
  messageId: string,
  recipient: string,
  eventData: any,
) {
  try {
    const clickedUrl = eventData.url;

    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "clicked" = "clicked" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `;

    // Log the click event
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: "clicked",
        clickedAt: new Date(eventData.timestamp * 1000),
      },
    });

    logger.info("Email clicked", {
      route: "POST /api/webhooks/mailgun",
      recipient,
      clickedUrl,
    });
  } catch (error) {
    logger.error(
      "Error handling clicked event",
      { route: "POST /api/webhooks/mailgun", messageId, recipient },
      error as Error,
    );
  }
}

async function handleBounced(
  messageId: string,
  recipient: string,
  eventData: any,
) {
  try {
    const bounceError = eventData.error || "Unknown bounce reason";
    const bounceCode = eventData.code || "unknown";

    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "bounced" = "bounced" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `;

    // Log the bounce
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: "bounced",
        error: `${bounceCode}: ${bounceError}`,
      },
    });

    // Mark email as bounced in contacts
    await prisma.contact.updateMany({
      where: { email: recipient },
      data: {
        status: "bounced",
        notes: `Email bounced: ${bounceError}`,
      },
    });

    logger.info("Email bounced", {
      route: "POST /api/webhooks/mailgun",
      recipient,
      bounceError,
    });
  } catch (error) {
    logger.error(
      "Error handling bounced event",
      { route: "POST /api/webhooks/mailgun", messageId, recipient },
      error as Error,
    );
  }
}

async function handleComplained(
  messageId: string,
  recipient: string,
  eventData: any,
) {
  try {
    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "complained" = "complained" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `;

    // Log the complaint
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: "complained",
        error: "Recipient marked as spam",
      },
    });

    // Mark email as complained and unsubscribe
    await prisma.contact.updateMany({
      where: { email: recipient },
      data: {
        status: "unsubscribed",
        unsubscribed: true,
        notes: "Marked email as spam",
      },
    });

    logger.info("Email complaint", {
      route: "POST /api/webhooks/mailgun",
      recipient,
    });
  } catch (error) {
    logger.error(
      "Error handling complained event",
      { route: "POST /api/webhooks/mailgun", messageId, recipient },
      error as Error,
    );
  }
}

async function handleUnsubscribed(
  messageId: string,
  recipient: string,
  eventData: any,
) {
  try {
    // Mark contact as unsubscribed
    await prisma.contact.updateMany({
      where: { email: recipient },
      data: {
        status: "unsubscribed",
        unsubscribed: true,
        notes: "Unsubscribed via email link",
      },
    });

    logger.info("Email unsubscribed", {
      route: "POST /api/webhooks/mailgun",
      recipient,
    });
  } catch (error) {
    logger.error(
      "Error handling unsubscribed event",
      { route: "POST /api/webhooks/mailgun", messageId, recipient },
      error as Error,
    );
  }
}

async function handleFailed(
  messageId: string,
  recipient: string,
  eventData: any,
) {
  try {
    const errorMessage = eventData.error || "Unknown failure reason";
    const severity = eventData.severity || "temporary";

    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "failed" = "failed" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `;

    // Log the failure
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: "failed",
        error: errorMessage,
      },
    });

    // If permanent failure, mark contact
    if (severity === "permanent") {
      await prisma.contact.updateMany({
        where: { email: recipient },
        data: {
          status: "invalid",
          notes: `Permanent failure: ${errorMessage}`,
        },
      });
    }

    logger.info("Email failed", {
      route: "POST /api/webhooks/mailgun",
      recipient,
      errorMessage,
    });
  } catch (error) {
    logger.error(
      "Error handling failed event",
      { route: "POST /api/webhooks/mailgun", messageId, recipient },
      error as Error,
    );
  }
}

// Allow GET for webhook verification
export const GET = withWebhookHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    return apiSuccess(
      {
        status: "ok",
        message: "Mailgun webhook endpoint is active",
      },
      { requestId },
    );
  },
  { route: "GET /api/webhooks/mailgun" },
);
