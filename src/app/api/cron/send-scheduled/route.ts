import { NextRequest } from "next/server";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/services/email.service";
import { SmsService } from "@/services/sms.service";

export const dynamic = "force-dynamic";

export const GET = withWebhookHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || cronSecret.length < 16) {
      return apiError("Server misconfigured", { status: 500, requestId });
    }
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const { timingSafeEqual } = await import("@/lib/env");
    if (!timingSafeEqual(token, cronSecret)) {
      return apiUnauthorized(requestId);
    }

    const now = new Date();
    let emailsSent = 0;
    let smsSent = 0;

    const emailCampaigns = await prisma.emailCampaign.findMany({
      where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    });

    for (const campaign of emailCampaigns) {
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: "SENDING" },
      });

      const customers = await prisma.customer.findMany({
        where: { organizationId: campaign.organizationId },
        take: 100,
      });

      for (const customer of customers) {
        if (customer.email) {
          try {
            await EmailService.send({
              to: customer.email,
              subject: campaign.subject,
              html: campaign.htmlContent || "",
              userId: campaign.createdById,
              organizationId: campaign.organizationId ?? undefined,
              campaignId: campaign.id,
            });
            emailsSent++;
          } catch {
            // individual send failure — continue
          }
        }
      }

      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          totalRecipients: emailsSent,
        },
      });
    }

    const smsCampaigns = await prisma.smsCampaign.findMany({
      where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    });

    for (const campaign of smsCampaigns) {
      await prisma.smsCampaign.update({
        where: { id: campaign.id },
        data: { status: "SENDING" },
      });

      const customers = await prisma.customer.findMany({
        where: { organizationId: campaign.organizationId },
        take: 100,
      });

      for (const customer of customers) {
        if (customer.phone) {
          try {
            await SmsService.send({
              to: customer.phone,
              message: campaign.message,
              userId: campaign.createdById,
              organizationId: campaign.organizationId ?? undefined,
              campaignId: campaign.id,
            });
            smsSent++;
          } catch {
            // individual send failure — continue
          }
        }
      }

      await prisma.smsCampaign.update({
        where: { id: campaign.id },
        data: { status: "SENT", sentAt: new Date(), totalRecipients: smsSent },
      });
    }

    return apiSuccess({ emailsSent, smsSent }, { requestId });
  },
  { route: "GET /api/cron/send-scheduled" },
);
