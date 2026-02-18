import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";

const twilio = require("twilio");

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;

    const call = await prisma.call.findUnique({
      where: { twilioCallSid: callSid },
      select: { metadata: true },
    });

    const analysis = (call?.metadata as any)?.aiAnalysis || {};
    const twiml = new twilio.twiml.VoiceResponse();

    if (analysis.canHandle && !analysis.needsAgent) {
      twiml.say(analysis.response);
      twiml.say(
        "Is there anything else I can help you with? Press 1 for yes, 2 to speak with an agent, or hang up.",
      );

      const gather = twiml.gather({
        numDigits: 1,
        action: `/api/ivr/ai-followup?orgId=${orgId}`,
        method: "POST",
      });
    } else {
      twiml.say(
        `I'll transfer you to our ${analysis.department || "support"} team. Please hold.`,
      );
      twiml.dial(process.env.TWILIO_PHONE_NUMBER);
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  },
  { route: "POST /api/ivr/ai-response" },
);
