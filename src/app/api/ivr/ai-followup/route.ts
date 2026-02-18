import { NextRequest, NextResponse } from "next/server";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";

const twilio = require("twilio");

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    const formData = await req.formData();
    const digits = formData.get("Digits") as string;

    const twiml = new twilio.twiml.VoiceResponse();

    if (digits === "1") {
      twiml.say("Please tell me how I can help you.");
      twiml.record({
        action: `/api/ivr/ai-agent?orgId=${orgId}`,
        method: "POST",
        maxLength: 30,
        transcribe: true,
        transcribeCallback: `/api/ivr/ai-process?orgId=${orgId}`,
      });
    } else if (digits === "2") {
      twiml.say("Transferring you to a live agent. Please hold.");
      twiml.dial(process.env.TWILIO_PHONE_NUMBER);
    } else {
      twiml.say("Thank you for calling. Goodbye.");
      twiml.hangup();
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  },
  { route: "POST /api/ivr/ai-followup" },
);
