import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(
  async (req: NextRequest, { session, organizationId, requestId }: ApiContext) => {
    const campaigns = await prisma.emailCampaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(campaigns, { requestId });
  },
  { route: "GET /api/email/campaigns" },
);

export const POST = withApiHandler(
  async (req: NextRequest, { session, organizationId, requestId }: ApiContext) => {
    const {
      name,
      subject,
      fromName,
      fromEmail,
      replyTo,
      preheader,
      content,
      scheduledFor,
      recipients,
      sendNow,
    } = await req.json();

    if (!name || !subject || !content) {
      return apiError("Name, subject, and content are required", {
        status: 400,
        requestId,
      });
    }

    const status = sendNow ? "SENT" : scheduledFor ? "SCHEDULED" : "DRAFT";

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        subject,
        htmlContent: content,
        fromName: fromName || "CallMaker24",
        fromEmail: fromEmail || "noreply@callmaker24.com",
        replyTo: replyTo,
        previewText: preheader,
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
      const { EmailService } = await import("@/services/email.service");
      const customers = await prisma.customer.findMany({
        where: { id: { in: recipients }, organizationId },
      });

      for (const customer of customers) {
        if (customer.email) {
          try {
            await EmailService.send({
              to: customer.email,
              subject: subject,
              html: content,
              userId: session.user.id,
              organizationId,
              campaignId: campaign.id,
            });
          } catch (_err) {
            // Individual send failures are non-fatal
          }
        }
      }
    }

    return apiSuccess(campaign, { status: 201, requestId });
  },
  { route: "POST /api/email/campaigns" },
);
