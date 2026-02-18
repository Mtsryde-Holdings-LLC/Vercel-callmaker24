import { NextRequest, NextResponse } from "next/server";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";

const twilio = require("twilio");

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("Processing your request. Please hold.");
    twiml.pause({ length: 3 });
    twiml.redirect(`/api/ivr/ai-response?orgId=${orgId}`);

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  },
  { route: "POST /api/ivr/ai-agent" },
);
