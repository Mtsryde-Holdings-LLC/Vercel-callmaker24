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
        route: "/api/webhooks/voice/status",
      });
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    if (
      !verifyTwilioWebhook(webhookUrl, params, twilioSignature, authToken)
    ) {
      logger.warn("Invalid Twilio signature on voice/status webhook", {
        requestId,
        route: "/api/webhooks/voice/status",
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    const CallSid = formData.get("CallSid") as string;
    const CallStatus = formData.get("CallStatus") as string;
    const To = formData.get("To") as string;
    const From = formData.get("From") as string;
    const Direction = formData.get("Direction") as string;

    // Find the call record to get organizationId
    const call = await prisma.call.findFirst({
      where: { twilioCallSid: CallSid },
      include: {
        customer: {
          select: { organizationId: true },
        },
      },
    });

    if (!call) {
      return apiSuccess({ received: true }, { requestId });
    }

    const organizationId = call.customer?.organizationId;

    if (!organizationId) {
      return apiSuccess({ received: true }, { requestId });
    }

    // Update call record (scoped to organization)
    await prisma.call.updateMany({
      where: {
        twilioCallSid: CallSid,
        customer: { organizationId },
      },
      data: {
        status: CallStatus as any,
        updatedAt: new Date(),
      },
    });

    return apiSuccess({ received: true }, { requestId });
  },
  { route: "POST /api/webhooks/voice/status" },
);
