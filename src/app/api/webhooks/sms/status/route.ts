import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { verifyTwilioWebhook, getWebhookUrl } from "@/lib/webhook-verify";
import { logger } from "@/lib/logger";

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
        route: "/api/webhooks/sms/status",
      });
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    if (!verifyTwilioWebhook(webhookUrl, params, twilioSignature, authToken)) {
      logger.warn("Invalid Twilio signature on sms/status webhook", {
        requestId,
        route: "/api/webhooks/sms/status",
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    const MessageSid = formData.get("MessageSid") as string;
    const MessageStatus = formData.get("MessageStatus") as string;
    const ErrorCode = formData.get("ErrorCode") as string;
    const ErrorMessage = formData.get("ErrorMessage") as string;

    if (MessageSid) {
      await prisma.smsMessage.updateMany({
        where: { twilioMessageSid: MessageSid },
        data: {
          status:
            MessageStatus === "delivered"
              ? "DELIVERED"
              : MessageStatus === "failed"
                ? "FAILED"
                : MessageStatus === "undelivered"
                  ? "FAILED"
                  : "SENT",
          deliveredAt: MessageStatus === "delivered" ? new Date() : null,
          errorCode: ErrorCode || null,
          errorMessage: ErrorMessage || null,
        },
      });
    }

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "POST /api/webhooks/sms/status" },
);
