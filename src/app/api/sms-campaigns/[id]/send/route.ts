import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

// POST /api/sms-campaigns/:id/send
export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, params, requestId }: ApiContext,
  ) => {
    const body = await request.json();
    const { sendNow, scheduledFor } = body;

    // Verify campaign belongs to user's organization
    const campaign = await prisma.smsCampaign.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!campaign) {
      return apiError("Campaign not found", { status: 404, requestId });
    }

    if (campaign.status !== "DRAFT") {
      return apiError("Only draft campaigns can be sent or scheduled", {
        status: 400,
        requestId,
      });
    }

    // Handle scheduling
    if (scheduledFor && !sendNow) {
      await prisma.smsCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "SCHEDULED",
          scheduledAt: new Date(scheduledFor),
        },
      });

      return apiSuccess(
        { scheduled: true, scheduledAt: scheduledFor },
        { requestId },
      );
    }

    // Handle immediate send
    // Get recipients from customer list (all customers with phone)
    const customers = await prisma.customer.findMany({
      where: {
        organizationId,
        phone: { not: null },
        status: "ACTIVE",
      },
    });

    await prisma.smsCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENDING",
        totalRecipients: customers.length,
      },
    });

    // Send SMS
    const { SmsService } = await import("@/services/sms.service");

    let successCount = 0;
    let failCount = 0;
    let rateLimitedCount = 0;

    for (const customer of customers) {
      if (customer.phone) {
        try {
          const result = await SmsService.send({
            to: customer.phone,
            message: campaign.message,
            userId: session.user.id,
            organizationId,
            campaignId: campaign.id,
          });

          if (result.success) {
            successCount++;
          } else if (result.error === "Rate limit exceeded") {
            rateLimitedCount++;
          } else {
            failCount++;
          }
        } catch (_err) {
          failCount++;
        }
      }
    }

    // Update campaign final status with accurate counts
    await prisma.smsCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        totalRecipients: customers.length,
        deliveredCount: successCount,
        failedCount: failCount,
      },
    });

    return apiSuccess(
      {
        sent: successCount,
        failed: failCount,
        rateLimited: rateLimitedCount,
        total: customers.length,
        message:
          rateLimitedCount > 0
            ? `${rateLimitedCount} customer(s) skipped due to rate limit (1 message per day limit)`
            : undefined,
      },
      { requestId },
    );
  },
  { route: "POST /api/sms-campaigns/[id]/send" },
);
