import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const campaigns = await prisma.smsCampaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(campaigns, { requestId });
  },
  { route: "GET /api/sms/campaigns" },
);

export const PATCH = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { id } = await req.json();
    const body = await req.json();

    const campaign = await prisma.smsCampaign.updateMany({
      where: { id, organizationId },
      data: body,
    });

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "PATCH /api/sms/campaigns" },
);

export const POST = withApiHandler(
  async (
    req: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const { name, message, scheduledFor, recipients, sendNow } =
      await req.json();

    if (!name || !message) {
      return apiError("Name and message are required", {
        status: 400,
        requestId,
      });
    }

    const status = sendNow ? "SENT" : scheduledFor ? "SCHEDULED" : "DRAFT";

    const campaign = await prisma.smsCampaign.create({
      data: {
        name,
        message,
        status,
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        sentAt: sendNow ? new Date() : null,
        createdById: session.user.id,
        organizationId,
        totalRecipients: recipients?.length || 0,
      },
    });

    // Send immediately if sendNow
    if (sendNow && recipients?.length > 0) {
      const { SmsService } = await import("@/services/sms.service");
      const customers = await prisma.customer.findMany({
        where: { id: { in: recipients }, organizationId },
      });

      let successCount = 0;

      for (const customer of customers) {
        if (customer.phone) {
          try {
            const result = await SmsService.send({
              to: customer.phone,
              message: message,
              userId: session.user.id,
              organizationId,
              campaignId: campaign.id,
            });
            if (result.success) {
              successCount++;
            }
          } catch (_err) {
            // Individual send failures are non-fatal
          }
        }
      }

      await prisma.smsCampaign.update({
        where: { id: campaign.id },
        data: { totalRecipients: successCount },
      });
    }

    return apiSuccess(campaign, { status: 201, requestId });
  },
  { route: "POST /api/sms/campaigns" },
);
