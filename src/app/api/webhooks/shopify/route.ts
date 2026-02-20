import { NextRequest } from "next/server";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyShopifyWebhook } from "@/lib/webhook-verify";
import { ShopifyBillingService } from "@/services/shopify-billing.service";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const POST = withWebhookHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    const shopDomain = request.headers.get("x-shopify-shop-domain");
    const topic = request.headers.get("x-shopify-topic");

    const body = await request.text();
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error("SHOPIFY_WEBHOOK_SECRET not configured", {
        requestId,
        route: "/api/webhooks/shopify",
      });
      return apiError("Server misconfigured", { status: 500, requestId });
    }

    // Verify webhook authenticity
    if (!verifyShopifyWebhook(body, hmacHeader, webhookSecret)) {
      return apiError("Invalid webhook signature", { status: 401, requestId });
    }

    const customerData = JSON.parse(body);

    // Process based on webhook topic
    switch (topic) {
      case "customers/create":
        await handleCustomerCreate(customerData, shopDomain);
        break;

      case "customers/update":
        await handleCustomerUpdate(customerData, shopDomain);
        break;

      case "customers/delete":
        await handleCustomerDelete(customerData, shopDomain);
        break;

      // Shopify Billing events
      case "app_subscriptions/update":
        await ShopifyBillingService.handleBillingWebhook(
          topic,
          shopDomain || "",
          customerData,
        );
        break;

      case "app/uninstalled":
        // App was uninstalled — cancel any active Shopify billing
        logger.info("Shopify app uninstalled", {
          route: "/api/webhooks/shopify",
          shopDomain,
          requestId,
        });
        if (shopDomain) {
          await handleAppUninstalled(shopDomain);
        }
        break;

      // GDPR mandatory webhooks — these have a dedicated endpoint at
      // /api/webhooks/shopify/gdpr but we handle them here as a fallback
      // in case merchants configure them to the main webhook URL.
      case "customers/data_request":
      case "customers/redact":
      case "shop/redact":
        logger.info("GDPR webhook received on main handler, forwarding", {
          route: "/api/webhooks/shopify",
          topic,
          shopDomain,
          requestId,
        });
        // Forward to the dedicated GDPR handler
        const gdprUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/shopify/gdpr`;
        await fetch(gdprUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-shopify-hmac-sha256": hmacHeader || "",
            "x-shopify-shop-domain": shopDomain || "",
            "x-shopify-topic": topic || "",
          },
          body,
        });
        break;

      default:
        logger.info("Unhandled Shopify webhook topic", {
          route: "/api/webhooks/shopify",
          topic,
          requestId,
        });
        break;
    }

    return apiSuccess({ success: true, topic }, { requestId });
  },
  { route: "POST /api/webhooks/shopify" },
);

async function handleCustomerCreate(customer: any, shopDomain: string | null) {
  try {
    // Transform Shopify customer data to our format
    const customerData = {
      id: `shopify_${customer.id}`,
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      tags: customer.tags
        ? customer.tags.split(",").map((t: string) => t.trim())
        : [],
      acceptsMarketing: customer.accepts_marketing || false,
      ordersCount: customer.orders_count || 0,
      totalSpent: customer.total_spent || "0.00",
      source: `Shopify - ${shopDomain}`,
      shopifyId: customer.id,
      shopDomain: shopDomain,
      createdAt: customer.created_at || new Date().toISOString(),
    };

    // Save to database (replace with actual database call)
    logger.info("Creating customer from webhook", {
      route: "POST /api/webhooks/shopify",
      shopifyId: customerData.shopifyId,
      email: customerData.email,
    });

    // Example: await prisma.customer.create({ data: customerData });
    // For now, we'll call our existing API
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/customers`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      },
    );

    logger.info("Customer created", {
      route: "POST /api/webhooks/shopify",
      email: customer.email,
    });
  } catch (error) {
    logger.error(
      "Error creating customer",
      { route: "POST /api/webhooks/shopify" },
      error as Error,
    );
  }
}

async function handleCustomerUpdate(customer: any, shopDomain: string | null) {
  try {
    const customerData = {
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      tags: customer.tags
        ? customer.tags.split(",").map((t: string) => t.trim())
        : [],
      acceptsMarketing: customer.accepts_marketing || false,
      ordersCount: customer.orders_count || 0,
      totalSpent: customer.total_spent || "0.00",
      updatedAt: new Date().toISOString(),
    };

    // Update in database (replace with actual database call)
    logger.info("Updating customer from webhook", {
      route: "POST /api/webhooks/shopify",
      shopifyId: customer.id,
      email: customer.email,
    });

    // Example: await prisma.customer.update({
    //   where: { shopifyId: customer.id },
    //   data: customerData
    // });

    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/customers/shopify_${customer.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      },
    );

    logger.info("Customer updated", {
      route: "POST /api/webhooks/shopify",
      email: customer.email,
    });
  } catch (error) {
    logger.error(
      "Error updating customer",
      { route: "POST /api/webhooks/shopify" },
      error as Error,
    );
  }
}

async function handleCustomerDelete(customer: any, shopDomain: string | null) {
  try {
    // Delete from database (replace with actual database call)
    logger.info("Deleting customer from webhook", {
      route: "POST /api/webhooks/shopify",
      shopifyId: customer.id,
    });

    // Example: await prisma.customer.delete({
    //   where: { shopifyId: customer.id }
    // });

    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/customers/shopify_${customer.id}`,
      {
        method: "DELETE",
      },
    );

    logger.info("Customer deleted", {
      route: "POST /api/webhooks/shopify",
      shopifyId: customer.id,
    });
  } catch (error) {
    logger.error(
      "Error deleting customer",
      { route: "POST /api/webhooks/shopify" },
      error as Error,
    );
  }
}

/**
 * Handle Shopify app uninstall — cancel billing and deactivate integration.
 * When a merchant uninstalls the app from their Shopify store, we must:
 * 1. Cancel any active Shopify billing subscriptions
 * 2. Downgrade the organization to FREE
 * 3. Mark the Shopify integration as inactive
 */
async function handleAppUninstalled(shopDomain: string) {
  try {
    // Find the integration by shop domain
    const integrations = await prisma.integration.findMany({
      where: {
        platform: "SHOPIFY",
        isActive: true,
      },
    });

    // Find the matching integration by shop domain in credentials
    const matchingIntegration = integrations.find((i) => {
      const creds = i.credentials as Record<string, string>;
      return creds?.shop === shopDomain;
    });

    if (!matchingIntegration) {
      logger.warn("No integration found for uninstalled shop", {
        route: "POST /api/webhooks/shopify",
        shopDomain,
      });
      return;
    }

    const organizationId = matchingIntegration.organizationId;
    if (!organizationId) {
      logger.warn("Integration has no organization", {
        route: "POST /api/webhooks/shopify",
        shopDomain,
        integrationId: matchingIntegration.id,
      });
      return;
    }

    // Cancel any Shopify billing subscriptions for this organization
    const subscriptions = await prisma.subscription.findMany({
      where: {
        billingProvider: "shopify",
        shopifyShop: shopDomain,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
    });

    for (const sub of subscriptions) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "CANCELLED" as const,
          cancelledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      });
    }

    // Downgrade organization
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionTier: "FREE" as const,
        subscriptionStatus: "CANCELLED" as const,
      },
    });

    // Deactivate the Shopify integration
    await prisma.integration.update({
      where: { id: matchingIntegration.id },
      data: { isActive: false },
    });

    logger.info("Shopify app uninstall processed", {
      route: "POST /api/webhooks/shopify",
      shopDomain,
      organizationId,
      cancelledSubscriptions: subscriptions.length,
    });
  } catch (error) {
    logger.error(
      "Error handling app uninstall",
      { route: "POST /api/webhooks/shopify", shopDomain },
      error as Error,
    );
  }
}
