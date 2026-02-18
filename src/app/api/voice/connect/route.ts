import { NextRequest, NextResponse } from "next/server";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiError } from "@/lib/api-response";

const twilio = require("twilio");

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    // Validate Twilio request signature
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      return apiError("Server misconfigured", { status: 500, requestId });
    }

    const signature = req.headers.get("x-twilio-signature") || "";
    const url = req.url;
    const body = await req.text();
    const params = Object.fromEntries(new URLSearchParams(body));

    const isValid = twilio.validateRequest(authToken, signature, url, params);
    if (!isValid) {
      return apiError("Unauthorized", { status: 403, requestId });
    }

    const agentId = req.nextUrl.searchParams.get("agentId");
    if (!agentId || !/^[\w+\-]+$/.test(agentId)) {
      return apiError("Invalid agent ID", { status: 400, requestId });
    }

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("Connecting you now.");
    twiml.dial().number(agentId);

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  },
  { route: "POST /api/voice/connect" },
);
