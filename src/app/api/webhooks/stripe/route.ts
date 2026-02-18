import { NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { PaymentService } from "@/services/payment.service";
import { logger } from "@/lib/logger";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";

// Lazy-init Stripe for webhook verification
let _stripeWebhook: Stripe | null = null;
function getStripeWebhook(): Stripe {
  if (!_stripeWebhook) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripeWebhook = new Stripe(key, { apiVersion: "2023-10-16" });
  }
  return _stripeWebhook;
}

// POST /api/webhooks/stripe
export const POST = withWebhookHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const body = await request.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      return apiError("No signature", { status: 400, requestId });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET not configured", {
        route: "webhooks/stripe",
      });
      return apiError("Server misconfigured", { status: 500, requestId });
    }

    let event: Stripe.Event;

    try {
      event = getStripeWebhook().webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
    } catch (err: unknown) {
      logger.warn("Webhook signature verification failed", {
        route: "webhooks/stripe",
      });
      return apiError("Invalid signature", { status: 400, requestId });
    }

    // Handle the event
    await PaymentService.handleWebhook(event);

    return apiSuccess({ received: true }, { requestId });
  },
  { route: "POST /api/webhooks/stripe" },
);
