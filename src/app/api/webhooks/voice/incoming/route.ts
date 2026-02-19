import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { verifyTwilioWebhook, getWebhookUrl } from "@/lib/webhook-verify";
import { logger } from "@/lib/logger";

const VoiceResponse = twilio.twiml.VoiceResponse;

export const GET = withWebhookHandler(
  async () => {
    const twiml = new VoiceResponse();
    twiml.say("Webhook is working");
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  },
  { route: "GET /api/webhooks/voice/incoming" },
);

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
        route: "/api/webhooks/voice/incoming",
      });
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    if (!verifyTwilioWebhook(webhookUrl, params, twilioSignature, authToken)) {
      logger.warn("Invalid Twilio signature on voice/incoming webhook", {
        requestId,
        route: "/api/webhooks/voice/incoming",
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    const CallSid = formData.get("CallSid") as string;
    const From = formData.get("From") as string;
    const To = formData.get("To") as string;

    // Find or create customer with default org
    let customer = await prisma.customer.findFirst({
      where: { phone: From },
    });

    if (!customer) {
      const org = await prisma.organization.findFirst();
      if (org) {
        customer = await prisma.customer.create({
          data: {
            phone: From,
            firstName: `Caller ${From}`,
            organizationId: org.id,
            lastName: "",
            email: `caller-${From.replace(/\D/g, "")}@unknown.com`,
          } as any,
        });
      }
    }

    // Create call record
    if (customer) {
      await prisma.call.create({
        data: {
          twilioCallSid: CallSid,
          direction: "INBOUND",
          from: From,
          to: To,
          status: "COMPLETED",
          customerId: customer.id,
        },
      });

      await prisma.customerActivity.create({
        data: {
          customerId: customer.id,
          type: "CALL_RECEIVED",
          description: `Incoming call from ${From}`,
        },
      });
    }

    const twiml = new VoiceResponse();
    const gather = twiml.gather({
      numDigits: 1,
      action: "/api/webhooks/voice/ivr-menu",
      method: "POST",
    });

    gather.say(
      "Thank you for calling. Press 1 for Sales. Press 2 for Support. Press 3 for Billing. Press 0 to speak with an operator.",
    );
    twiml.redirect("/api/webhooks/voice/incoming");

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  },
  { route: "POST /api/webhooks/voice/incoming" },
);
