import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/**
 * Sync Campaign Metrics
 *
 * Recalculates campaign metrics from actual message data.
 * Useful for fixing any discrepancies or getting real-time data.
 *
 * POST /api/sms-campaigns/:id/sync-metrics
 */

export const POST = withApiHandler(
  async (
    request: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    // Verify campaign exists and belongs to user's org
    const campaign = await prisma.smsCampaign.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!campaign) {
      return apiError("Campaign not found", { status: 404, requestId });
    }

    // Get all messages for this campaign
    const messages = await prisma.smsMessage.findMany({
      where: { campaignId: campaign.id },
      select: { status: true },
    });

    // Calculate metrics
    const totalRecipients = messages.length;
    const deliveredCount = messages.filter(
      (m) => m.status === "DELIVERED",
    ).length;
    const failedCount = messages.filter(
      (m) => m.status === "FAILED" || m.status === "UNDELIVERED",
    ).length;
    const repliedCount = messages.filter((m) => m.status === "REPLIED").length;
    const optOutCount = messages.filter((m) => m.status === "OPT_OUT").length;

    // Update campaign
    await prisma.smsCampaign.update({
      where: { id: campaign.id },
      data: {
        totalRecipients,
        deliveredCount,
        failedCount,
        repliedCount,
        optOutCount,
      },
    });

    return apiSuccess(
      {
        metrics: {
          totalRecipients,
          deliveredCount,
          failedCount,
          repliedCount,
          optOutCount,
          deliveryRate:
            totalRecipients > 0
              ? ((deliveredCount / totalRecipients) * 100).toFixed(1) + "%"
              : "0%",
        },
      },
      { requestId },
    );
  },
  { route: "POST /api/sms-campaigns/[id]/sync-metrics" },
);
