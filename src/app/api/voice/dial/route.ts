import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const twilio = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const { to, customerId } = await request.json();

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { twilioPhoneNumber: true },
    });

    if (!org?.twilioPhoneNumber) {
      return apiError("No phone number configured", { status: 400, requestId });
    }

    const call = await twilio.calls.create({
      to,
      from: org.twilioPhoneNumber,
      url: `${process.env.NEXTAUTH_URL}/api/voice/connect?agentId=${session.user.id}`,
      statusCallback: `${process.env.NEXTAUTH_URL}/api/voice/status`,
      statusCallbackEvent: ["completed"],
    });

    await prisma.call.create({
      data: {
        twilioCallSid: call.sid,
        direction: "OUTBOUND",
        status: "INITIATED",
        from: org.twilioPhoneNumber,
        to,
        customerId,
        assignedToId: session.user.id,
        organizationId,
      },
    });

    return apiSuccess({ callSid: call.sid }, { requestId });
  },
  { route: "POST /api/voice/dial" },
);
