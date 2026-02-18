import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { verifyTwilioWebhook, getWebhookUrl } from "@/lib/webhook-verify";
import { logger } from "@/lib/logger";

const VoiceResponse = twilio.twiml.VoiceResponse;

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
        route: "/api/webhooks/voice/ivr-menu",
      });
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    if (
      !verifyTwilioWebhook(webhookUrl, params, twilioSignature, authToken)
    ) {
      logger.warn("Invalid Twilio signature on voice/ivr-menu webhook", {
        requestId,
        route: "/api/webhooks/voice/ivr-menu",
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    const Digits = formData.get("Digits") as string;

    const twiml = new VoiceResponse();

    const forwardNumber = process.env.IVR_FORWARD_NUMBER || "+13163342262";

    switch (Digits) {
      case "1":
        twiml.say("Connecting you to Sales.");
        twiml.dial(forwardNumber);
        break;
      case "2":
        twiml.say("Connecting you to Support.");
        twiml.dial(forwardNumber);
        break;
      case "3":
        twiml.say("Connecting you to Billing.");
        twiml.dial(forwardNumber);
        break;
      case "0":
        twiml.say("Connecting you to an operator.");
        twiml.dial(forwardNumber);
        break;
      default:
        twiml.say("Invalid option. Please try again.");
        twiml.redirect("/api/webhooks/voice/incoming");
        break;
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  },
  { route: "POST /api/webhooks/voice/ivr-menu" },
);
