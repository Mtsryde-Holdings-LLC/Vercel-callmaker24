import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
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
  } catch (error) {
    console.error("IVR menu error:", error);
    const twiml = new VoiceResponse();
    twiml.say("An error occurred.");
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
