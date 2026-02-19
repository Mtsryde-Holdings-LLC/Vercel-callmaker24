import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifySendGridWebhook } from "@/lib/webhook-verify";
import { logger } from "@/lib/logger";

// SendGrid webhook for email events
export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    // Verify SendGrid Event Webhook signature (ECDSA)
    const signature = req.headers.get("x-twilio-email-event-webhook-signature");
    const timestamp = req.headers.get("x-twilio-email-event-webhook-timestamp");
    const publicKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY;
    const clonedReq = req.clone();
    const rawBody = await clonedReq.text();

    if (!publicKey) {
      logger.error("SENDGRID_WEBHOOK_VERIFICATION_KEY not configured", {
        requestId,
        route: "/api/webhooks/email",
      });
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    if (!verifySendGridWebhook(publicKey, rawBody, signature, timestamp)) {
      logger.warn("Invalid SendGrid webhook signature", {
        requestId,
        route: "/api/webhooks/email",
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    const events = JSON.parse(rawBody);

    if (!Array.isArray(events)) {
      return apiError("Invalid payload", { status: 400, requestId });
    }

    for (const event of events) {
      const { sg_message_id, event: eventType, email, timestamp } = event;

      // Find the email message to get organizationId
      const emailMessage = await prisma.emailMessage.findFirst({
        where: { to: email },
        include: {
          campaign: {
            select: { organizationId: true },
          },
          customer: {
            select: { organizationId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!emailMessage) {
        continue;
      }

      const organizationId =
        emailMessage.campaign?.organizationId ||
        emailMessage.customer?.organizationId;

      if (!organizationId) {
        continue;
      }

      // Update email campaign analytics based on event type (scoped to organization)
      switch (eventType) {
        case "delivered":
          await prisma.emailMessage.updateMany({
            where: {
              to: email,
              campaign: { organizationId },
            },
            data: { status: "DELIVERED", deliveredAt: new Date() },
          });
          break;
        case "open":
          await prisma.emailMessage.updateMany({
            where: {
              to: email,
              campaign: { organizationId },
            },
            data: {
              openedAt: new Date(),
              opened: true,
              status: "OPENED",
            },
          });
          break;
        case "click":
          await prisma.emailMessage.updateMany({
            where: {
              to: email,
              campaign: { organizationId },
            },
            data: {
              clickedAt: new Date(),
              clicked: true,
              status: "CLICKED",
            },
          });
          break;
        case "bounce":
        case "dropped":
          await prisma.emailMessage.updateMany({
            where: {
              to: email,
              campaign: { organizationId },
            },
            data: { status: "BOUNCED", bouncedAt: new Date() },
          });
          break;
        case "spam_report":
          await prisma.customer.updateMany({
            where: {
              email,
              organizationId,
            },
            data: { emailOptIn: false },
          });
          break;
        case "unsubscribe":
          await prisma.customer.updateMany({
            where: {
              email,
              organizationId,
            },
            data: { emailOptIn: false },
          });
          break;
      }
    }

    return apiSuccess({ received: true }, { requestId });
  },
  { route: "POST /api/webhooks/email" },
);
