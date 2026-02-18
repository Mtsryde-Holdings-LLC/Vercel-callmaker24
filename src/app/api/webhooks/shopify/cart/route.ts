import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyShopifyWebhook } from "@/lib/webhook-verify";
import { logger } from "@/lib/logger";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const body = await req.text();

    // Verify Shopify HMAC signature
    const hmac = req.headers.get("x-shopify-hmac-sha256");
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("SHOPIFY_WEBHOOK_SECRET not configured", {
        requestId,
        route: "webhooks/shopify/cart",
      });
      return apiError("Server misconfigured", { status: 500, requestId });
    }
    if (!verifyShopifyWebhook(body, hmac, webhookSecret)) {
      logger.warn("Invalid Shopify cart webhook signature", {
        route: "webhooks/shopify/cart",
      });
      return apiError("Invalid signature", { status: 401, requestId });
    }

    const checkout = JSON.parse(body);

    const integration = await prisma.integration.findFirst({
      where: {
        platform: "SHOPIFY",
        credentials: {
          path: ["shop"],
          equals: req.headers.get("x-shopify-shop-domain") ?? undefined,
        },
      },
    });

    if (!integration) {
      return apiError("Integration not found", { status: 404, requestId });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        email: checkout.email,
        organizationId: integration.organizationId,
      },
    });

    if (!customer) {
      return apiSuccess({ success: true }, { requestId });
    }

    // Create abandoned cart record
    await prisma.abandonedCart.create({
      data: {
        customerId: customer.id,
        organizationId: integration.organizationId,
        total: parseFloat(checkout.total_price),
        cartUrl: checkout.abandoned_checkout_url,
        items: checkout.line_items,
        externalId: checkout.id.toString(),
      },
    });

    // Note: Recovery emails/SMS are handled by the abandoned-cart-recovery cron job
    // which runs every 30 minutes and sends messages to carts abandoned 1+ hours ago

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "POST /api/webhooks/shopify/cart" },
);
