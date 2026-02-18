import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const twilio = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export const GET = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const availableNumbers = await twilio
      .availablePhoneNumbers("US")
      .local.list({ limit: 5 });

    return apiSuccess(
      {
        numbers: availableNumbers.map((n: any) => ({
          phoneNumber: n.phoneNumber,
          locality: n.locality,
          region: n.region,
        })),
      },
      { requestId },
    );
  },
  { route: "GET /api/organization/phone" },
);

export const POST = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { action } = await request.json();

    if (action === "purchase") {
      const availableNumbers = await twilio
        .availablePhoneNumbers("US")
        .local.list({ limit: 1 });

      if (!availableNumbers.length) {
        return apiError("No numbers available", { status: 400, requestId });
      }

      const number = availableNumbers[0];
      const purchasedNumber = await twilio.incomingPhoneNumbers.create({
        phoneNumber: number.phoneNumber,
        voiceUrl: `${process.env.NEXTAUTH_URL}/api/ivr/direct`,
        voiceMethod: "POST",
        smsUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/twilio/sms`,
        smsMethod: "POST",
      });

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          twilioPhoneNumber: purchasedNumber.phoneNumber,
          twilioPhoneSid: purchasedNumber.sid,
        },
      });

      return apiSuccess(
        {
          phoneNumber: purchasedNumber.phoneNumber,
          sid: purchasedNumber.sid,
        },
        { requestId },
      );
    }

    if (action === "release") {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { twilioPhoneSid: true },
      });

      if (org?.twilioPhoneSid) {
        await twilio.incomingPhoneNumbers(org.twilioPhoneSid).remove();

        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            twilioPhoneNumber: null,
            twilioPhoneSid: null,
          },
        });
      }

      return apiSuccess({ success: true }, { requestId });
    }

    return apiError("Invalid action", { status: 400, requestId });
  },
  { route: "POST /api/organization/phone" },
);
