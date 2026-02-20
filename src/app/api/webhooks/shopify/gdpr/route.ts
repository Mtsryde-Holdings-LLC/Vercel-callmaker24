/**
 * POST /api/webhooks/shopify/gdpr
 *
 * Shopify Mandatory GDPR Webhooks
 *
 * Shopify requires these 3 GDPR webhook endpoints for App Store listing:
 * 1. customers/data_request — Merchant requests customer data (Subject Access Request)
 * 2. customers/redact — Merchant requests customer data deletion (Right to Erasure)
 * 3. shop/redact — Shopify requests all shop data deletion (48h after app uninstall)
 *
 * @see https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks
 */

import { NextRequest } from "next/server";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyShopifyWebhook } from "@/lib/webhook-verify";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const ROUTE = "POST /api/webhooks/shopify/gdpr";

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
        route: ROUTE,
      });
      return apiError("Server misconfigured", { status: 500, requestId });
    }

    // Verify webhook authenticity
    if (!verifyShopifyWebhook(body, hmacHeader, webhookSecret)) {
      logger.warn("Invalid GDPR webhook signature", {
        route: ROUTE,
        topic,
        shopDomain,
        requestId,
      });
      return apiError("Invalid webhook signature", { status: 401, requestId });
    }

    const payload = JSON.parse(body);

    switch (topic) {
      case "customers/data_request":
        await handleCustomersDataRequest(payload, shopDomain, requestId);
        break;

      case "customers/redact":
        await handleCustomersRedact(payload, shopDomain, requestId);
        break;

      case "shop/redact":
        await handleShopRedact(payload, shopDomain, requestId);
        break;

      default:
        logger.warn("Unknown GDPR webhook topic", {
          route: ROUTE,
          topic,
          requestId,
        });
        break;
    }

    return apiSuccess({ success: true, topic }, { requestId });
  },
  { route: ROUTE },
);

/**
 * customers/data_request
 *
 * A merchant has received a data subject access request (DSAR) from a customer
 * and wants to know what data the app stores about that customer.
 *
 * Payload: { shop_id, shop_domain, orders_requested, customer: { id, email, phone }, data_request: { id } }
 *
 * Response: We gather all customer data from our database and log it.
 * In production, this should trigger an email to the app owner with the data,
 * or queue a job to compile and send the data to the merchant.
 */
async function handleCustomersDataRequest(
  payload: any,
  shopDomain: string | null,
  requestId: string,
) {
  const { customer, shop_domain, data_request } = payload;

  logger.info("GDPR: Customer data request received", {
    route: ROUTE,
    shopDomain: shop_domain || shopDomain,
    shopifyCustomerId: customer?.id,
    customerEmail: customer?.email,
    dataRequestId: data_request?.id,
    requestId,
  });

  try {
    // Find customer data in our database
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          ...(customer?.email ? [{ email: customer.email }] : []),
          ...(customer?.id ? [{ shopifyId: String(customer.id) }] : []),
          ...(customer?.phone ? [{ phone: customer.phone }] : []),
        ],
      },
      include: {
        tags: true,
        segments: true,
      },
    });

    if (customers.length > 0) {
      // Log the data found — in production, email this to privacy@callmaker24.com
      // or queue a data export job
      logger.info("GDPR: Customer data found for data request", {
        route: ROUTE,
        shopDomain: shop_domain || shopDomain,
        shopifyCustomerId: customer?.id,
        matchedCustomerCount: customers.length,
        customerIds: customers.map((c) => c.id),
        dataRequestId: data_request?.id,
        requestId,
      });
    } else {
      logger.info("GDPR: No customer data found for data request", {
        route: ROUTE,
        shopDomain: shop_domain || shopDomain,
        shopifyCustomerId: customer?.id,
        dataRequestId: data_request?.id,
        requestId,
      });
    }
  } catch (error) {
    logger.error(
      "GDPR: Error processing customer data request",
      { route: ROUTE, shopDomain: shop_domain || shopDomain, requestId },
      error as Error,
    );
  }
}

/**
 * customers/redact
 *
 * A merchant requests that we delete all stored data for a specific customer.
 * This must be completed within 30 days of receiving the request.
 *
 * Payload: { shop_id, shop_domain, customer: { id, email, phone }, orders_to_redact: [id, ...] }
 *
 * We delete/anonymize all PII for the matching customer(s).
 */
async function handleCustomersRedact(
  payload: any,
  shopDomain: string | null,
  requestId: string,
) {
  const { customer, shop_domain, orders_to_redact } = payload;

  logger.info("GDPR: Customer redact request received", {
    route: ROUTE,
    shopDomain: shop_domain || shopDomain,
    shopifyCustomerId: customer?.id,
    customerEmail: customer?.email,
    ordersToRedact: orders_to_redact?.length || 0,
    requestId,
  });

  try {
    // Find matching customers
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          ...(customer?.email ? [{ email: customer.email }] : []),
          ...(customer?.id ? [{ shopifyId: String(customer.id) }] : []),
          ...(customer?.phone ? [{ phone: customer.phone }] : []),
        ],
      },
    });

    if (customers.length === 0) {
      logger.info("GDPR: No customer data to redact", {
        route: ROUTE,
        shopDomain: shop_domain || shopDomain,
        shopifyCustomerId: customer?.id,
        requestId,
      });
      return;
    }

    // Anonymize/redact customer data
    for (const c of customers) {
      await prisma.customer.update({
        where: { id: c.id },
        data: {
          email: null,
          phone: null,
          firstName: "[REDACTED]",
          lastName: "[REDACTED]",
          company: null,
          avatar: null,
          notes: null,
          address: null,
          customFields: Prisma.DbNull,
          metadata: Prisma.DbNull,
          birthday: null,
          portalToken: null,
          portalTokenExpiry: null,
          status: "INACTIVE",
        },
      });

      logger.info("GDPR: Customer data redacted", {
        route: ROUTE,
        customerId: c.id,
        shopifyId: c.shopifyId,
        shopDomain: shop_domain || shopDomain,
        requestId,
      });
    }

    // Also delete related activities
    await prisma.customerActivity.deleteMany({
      where: {
        customerId: { in: customers.map((c) => c.id) },
      },
    });

    logger.info("GDPR: Customer redaction completed", {
      route: ROUTE,
      shopDomain: shop_domain || shopDomain,
      redactedCount: customers.length,
      requestId,
    });
  } catch (error) {
    logger.error(
      "GDPR: Error processing customer redact",
      { route: ROUTE, shopDomain: shop_domain || shopDomain, requestId },
      error as Error,
    );
  }
}

/**
 * shop/redact
 *
 * Shopify sends this 48 hours after a merchant uninstalls the app.
 * We must delete ALL data associated with that shop.
 *
 * Payload: { shop_id, shop_domain }
 */
async function handleShopRedact(
  payload: any,
  shopDomain: string | null,
  requestId: string,
) {
  const { shop_domain, shop_id } = payload;
  const domain = shop_domain || shopDomain;

  logger.info("GDPR: Shop redact request received", {
    route: ROUTE,
    shopDomain: domain,
    shopId: shop_id,
    requestId,
  });

  try {
    // Find all integrations for this shop
    const integrations = await prisma.integration.findMany({
      where: {
        platform: "SHOPIFY",
      },
    });

    const matchingIntegrations = integrations.filter((i) => {
      const creds = i.credentials as Record<string, string>;
      return creds?.shop === domain;
    });

    if (matchingIntegrations.length === 0) {
      logger.info("GDPR: No integrations found for shop redact", {
        route: ROUTE,
        shopDomain: domain,
        requestId,
      });
      return;
    }

    for (const integration of matchingIntegrations) {
      const orgId = integration.organizationId;

      if (orgId) {
        // Delete all customers associated with this org that came from Shopify
        const shopifyCustomers = await prisma.customer.findMany({
          where: {
            organizationId: orgId,
            source: { contains: "Shopify" },
          },
          select: { id: true },
        });

        if (shopifyCustomers.length > 0) {
          // Delete customer activities first (foreign key)
          await prisma.customerActivity.deleteMany({
            where: {
              customerId: { in: shopifyCustomers.map((c) => c.id) },
            },
          });

          // Anonymize Shopify-sourced customers
          await prisma.customer.updateMany({
            where: {
              organizationId: orgId,
              source: { contains: "Shopify" },
            },
            data: {
              email: null,
              phone: null,
              firstName: "[REDACTED]",
              lastName: "[REDACTED]",
              company: null,
              avatar: null,
              notes: null,
              address: null,
              customFields: Prisma.DbNull,
              metadata: Prisma.DbNull,
              birthday: null,
              shopifyId: null,
              portalToken: null,
              portalTokenExpiry: null,
              status: "INACTIVE",
            },
          });

          logger.info("GDPR: Shop customers redacted", {
            route: ROUTE,
            shopDomain: domain,
            organizationId: orgId,
            customersRedacted: shopifyCustomers.length,
            requestId,
          });
        }

        // Cancel any Shopify billing subscriptions
        await prisma.subscription.updateMany({
          where: {
            organizationId: orgId,
            billingProvider: "shopify",
            shopifyShop: domain,
          },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        });
      }

      // Remove credentials from the integration (keep record for audit trail)
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          credentials: { shop: domain, accessToken: "[REDACTED]" },
          isActive: false,
        },
      });

      logger.info("GDPR: Integration credentials redacted", {
        route: ROUTE,
        shopDomain: domain,
        integrationId: integration.id,
        requestId,
      });
    }

    logger.info("GDPR: Shop redaction completed", {
      route: ROUTE,
      shopDomain: domain,
      shopId: shop_id,
      integrationsProcessed: matchingIntegrations.length,
      requestId,
    });
  } catch (error) {
    logger.error(
      "GDPR: Error processing shop redact",
      { route: ROUTE, shopDomain: domain, requestId },
      error as Error,
    );
  }
}
