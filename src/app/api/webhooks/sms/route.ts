import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { verifyTwilioWebhook, getWebhookUrl } from "@/lib/webhook-verify";
import { logger } from "@/lib/logger";
const MessagingResponse = twilio.twiml.MessagingResponse;

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
        route: "/api/webhooks/sms",
      });
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    if (!verifyTwilioWebhook(webhookUrl, params, twilioSignature, authToken)) {
      logger.warn("Invalid Twilio signature on sms webhook", {
        requestId,
        route: "/api/webhooks/sms",
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    const MessageSid = formData.get("MessageSid") as string;
    const From = formData.get("From") as string;
    const To = formData.get("To") as string;
    const Body = formData.get("Body") as string;
    const MessageStatus = formData.get("MessageStatus") as string;

    // Find the SMS message to get organizationId
    const smsMessage = await prisma.smsMessage.findFirst({
      where: {
        OR: [{ to: From }, { twilioSid: MessageSid }],
      },
      include: {
        campaign: {
          select: { organizationId: true },
        },
        customer: {
          select: { organizationId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let organizationId: string | null = null;
    if (smsMessage) {
      organizationId =
        smsMessage.campaign?.organizationId ||
        smsMessage.customer?.organizationId ||
        null;
    }

    // If organizationId found, process the message (scoped to organization)
    if (organizationId && MessageSid) {
      await prisma.smsMessage.updateMany({
        where: {
          twilioSid: MessageSid,
          campaign: { organizationId },
        },
        data: {
          status:
            MessageStatus === "delivered"
              ? "DELIVERED"
              : MessageStatus === "failed"
                ? "FAILED"
                : "SENT",
          deliveredAt: MessageStatus === "delivered" ? new Date() : null,
        },
      });
    }

    // Send TwiML response (optional - for auto-replies)
    const twiml = new MessagingResponse();
    // Uncomment to send auto-reply:
    // twiml.message('Thank you for your message! We will get back to you soon.')

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  },
  { route: "POST /api/webhooks/sms" },
);
