import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { SmsService } from "@/services/sms.service";

export const POST = withApiHandler(
  async (
    req: NextRequest,
    { session, organizationId, params, requestId }: ApiContext,
  ) => {
    const { recipients } = await req.json();

    if (!recipients || recipients.length === 0) {
      return apiError("No recipients", { status: 400, requestId });
    }

    const campaign = await prisma.smsCampaign.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!campaign) {
      return apiError("Campaign not found", { status: 404, requestId });
    }

    // Get customers
    const customers = await prisma.customer.findMany({
      where: { id: { in: recipients }, organizationId },
    });

    let sent = 0;
    for (const customer of customers) {
      if (customer.phone) {
        try {
          await SmsService.send({
            to: customer.phone,
            message: campaign.message,
            userId: session.user.id,
            organizationId,
            campaignId: campaign.id,
          });
          sent++;
        } catch (_err) {
          // Individual send failures are non-fatal
        }
      }
    }

    await prisma.smsCampaign.update({
      where: { id: params.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        totalRecipients: sent,
      },
    });

    return apiSuccess({ sent }, { requestId });
  },
  { route: "POST /api/sms/campaigns/[id]/send" },
);
