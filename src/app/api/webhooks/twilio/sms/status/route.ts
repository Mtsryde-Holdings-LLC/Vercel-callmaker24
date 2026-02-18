import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyTwilioWebhook, getWebhookUrl } from "@/lib/webhook-verify";
import { logger } from "@/lib/logger";

/**
 * Twilio SMS Status Webhook
 *
 * Receives delivery status updates from Twilio and updates message records.
 * This ensures real-time tracking of SMS delivery, failures, and replies.
 *
 * Configure in Twilio Console:
 * Messaging > Settings > Webhook URL for status callbacks
 * POST https://yourdomain.com/api/webhooks/twilio/sms/status
 */

export const dynamic = "force-dynamic";

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    // Verify Twilio signature
    const twilioSignature = req.headers.get("x-twilio-signature");
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const clonedReq = req.clone();
    const formData = await clonedReq.formData();
    const params: Record<string, string> = {};
    formData.forEach((v, k) => {
      params[k] = String(v);
    });
    const webhookUrl = getWebhookUrl(req);

    if (!authToken) {
      logger.error("TWILIO_AUTH_TOKEN not configured", {
        requestId,
        route: "/api/webhooks/twilio/sms/status",
      });
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    if (
      !verifyTwilioWebhook(webhookUrl, params, twilioSignature, authToken)
    ) {
      logger.warn("Invalid Twilio signature on twilio/sms/status webhook", {
        requestId,
        route: "/api/webhooks/twilio/sms/status",
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    const messageSid = formData.get("MessageSid") as string;
    const messageStatus = formData.get("MessageStatus") as string;
    const errorCode = formData.get("ErrorCode") as string | null;
    const errorMessage = formData.get("ErrorMessage") as string | null;

    if (!messageSid || !messageStatus) {
      return apiError("Missing required parameters", {
        status: 400,
        requestId,
      });
    }

    // Find the message by Twilio SID
    const message = await prisma.smsMessage.findUnique({
      where: { twilioSid: messageSid },
      include: { campaign: true },
    });

    if (!message) {
      return apiError("Message not found", { status: 404, requestId });
    }

    // Map Twilio status to our SMS status
    let status: string;
    switch (messageStatus.toLowerCase()) {
      case "delivered":
        status = "DELIVERED";
        break;
      case "sent":
      case "queued":
      case "sending":
        status = "SENT";
        break;
      case "failed":
      case "undelivered":
        status = "FAILED";
        break;
      case "received":
        status = "REPLIED";
        break;
      default:
        status = "PENDING";
    }

    // Update message status
    await prisma.smsMessage.update({
      where: { id: message.id },
      data: {
        status: status as any,
        errorCode: errorCode || undefined,
        errorMessage: errorMessage || undefined,
      },
    });

    // Update campaign counters if this message belongs to a campaign
    if (message.campaignId) {
      await updateCampaignMetrics(message.campaignId);
    }

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "POST /api/webhooks/twilio/sms/status" },
);

/**
 * Recalculate campaign metrics from actual message data
 */
async function updateCampaignMetrics(campaignId: string) {
  try {
    const messages = await prisma.smsMessage.findMany({
      where: { campaignId },
      select: { status: true },
    });

    const deliveredCount = messages.filter(
      (m) => m.status === "DELIVERED",
    ).length;
    const failedCount = messages.filter(
      (m) => m.status === "FAILED" || m.status === "UNDELIVERED",
    ).length;
    const repliedCount = messages.filter((m) => m.status === "REPLIED").length;
    const optOutCount = messages.filter((m) => m.status === "OPT_OUT").length;

    await prisma.smsCampaign.update({
      where: { id: campaignId },
      data: {
        deliveredCount,
        failedCount,
        repliedCount,
        optOutCount,
      },
    });

    logger.info(
      `Updated campaign ${campaignId}: ${deliveredCount} delivered, ${failedCount} failed`,
      { route: "/api/webhooks/twilio/sms/status" },
    );
  } catch (error) {
    logger.error(
      "Failed to update campaign metrics",
      { route: "/api/webhooks/twilio/sms/status" },
      error,
    );
  }
}
