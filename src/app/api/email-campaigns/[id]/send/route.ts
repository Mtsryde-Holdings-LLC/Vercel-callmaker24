import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/services/email.service";

// POST /api/email-campaigns/:id/send
export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, params, requestId }: ApiContext,
  ) => {
    const body = await request.json();
    const { sendNow, scheduledFor } = body;

    // Verify campaign belongs to user's organization
    const campaign = await prisma.emailCampaign.findFirst({
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
      await prisma.emailCampaign.update({
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

    // Get recipients — filter by segment if segmentIds are specified
    const segmentIds = (campaign.segmentIds as string[]) || [];
    const customerWhere: Record<string, unknown> = {
      organizationId,
      emailOptIn: true,
      status: "ACTIVE",
    };

    if (segmentIds.length > 0) {
      customerWhere.segments = { some: { id: { in: segmentIds } } };
    }

    const customers = await prisma.customer.findMany({
      where: customerWhere,
    });

    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENDING",
        totalRecipients: customers.length,
      },
    });

    // Send emails in batches
    const batchSize = 50;
    let sentCount = 0;

    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);

      const sendPromises = batch.map(async (customer) => {
        // Create email message record
        const message = await prisma.emailMessage.create({
          data: {
            campaignId: campaign.id,
            customerId: customer.id,
            to: customer.email!,
            subject: campaign.subject,
            htmlContent: campaign.htmlContent,
            textContent: campaign.textContent,
            status: "PENDING",
          },
        });

        // Send email
        const result = await EmailService.send({
          to: customer.email!,
          subject: campaign.subject,
          html: campaign.htmlContent,
          text: campaign.textContent ?? undefined,
          from: `${campaign.fromName} <${campaign.fromEmail}>`,
          replyTo: campaign.replyTo ?? undefined,
        });

        // Update message status
        if (result.success) {
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
            },
          });
          sentCount++;
        } else {
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: {
              status: "FAILED",
              errorMessage: result.error,
            },
          });
        }
      });

      await Promise.all(sendPromises);
    }

    // Update campaign final status
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        deliveredCount: sentCount,
      },
    });

    return apiSuccess(
      { sent: sentCount, total: customers.length },
      { requestId },
    );
  },
  { route: "POST /api/email-campaigns/[id]/send" },
);
