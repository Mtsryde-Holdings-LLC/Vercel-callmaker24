import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";

const twilio = require("twilio");

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const twiml = new twilio.twiml.VoiceResponse();

    const formData = await req.formData();
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;

    const org = await prisma.organization.findUnique({
      where: { twilioPhoneNumber: to },
      select: {
        id: true,
        name: true,
        ivrConfig: true,
        agentContactNumber: true,
      },
    });

    if (!org) {
      twiml.say("This number is not configured. Please contact support.");
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    twiml.say(
      `Welcome to CallMaker24 AI Call Support Center. Connecting you to ${org.name}.`,
    );

    if (org.agentContactNumber) {
      twiml.say("Routing to agent.");
      twiml.dial(org.agentContactNumber);
    } else {
      twiml.say("Our AI assistant will help you. Please speak after the tone.");
      twiml.record({
        action: `/api/ivr/ai-agent?orgId=${org.id}`,
        method: "POST",
        maxLength: 30,
        transcribe: true,
        transcribeCallback: `/api/ivr/ai-process?orgId=${org.id}`,
      });
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  },
  { route: "POST /api/ivr/direct" },
);
