/**
 * POST /api/shopify/sync
 *
 * Sync endpoint for the embedded Shopify app.
 * Authenticates via App Bridge session token.
 * Uses the same Prisma patterns as the main sync route.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { authenticateShopifyRequest } from "@/lib/shopify/session-token";
import { isValidShopDomain } from "@/lib/shopify/verify-request";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const SHOPIFY_API_VERSION = "2025-01";

export async function POST(request: NextRequest) {
  // Authenticate via session token
  const sessionAuth = await authenticateShopifyRequest(request);

  // Clone request to read body (body can only be read once)
  let shop: string;
  try {
    const body = await request.json();
    shop = sessionAuth?.shop || body.shop || "";
  } catch {
    shop = sessionAuth?.shop || "";
  }

  if (!shop || !isValidShopDomain(shop)) {
    return apiError("Invalid or missing shop domain", { status: 400 });
  }

  try {
    // Find integration for this shop
    const integration = await prisma.integration.findFirst({
      where: {
        platform: "SHOPIFY",
        isActive: true,
        credentials: { path: ["shop"], equals: shop },
      },
    });

    if (!integration) {
      return apiError("Shop not connected. Please reinstall the app.", {
        status: 401,
      });
    }

    const credentials = integration.credentials as {
      shop: string;
      accessToken: string;
    };
    const accessToken = credentials.accessToken;
    const organizationId = integration.organizationId || "";

    if (!accessToken) {
      return apiError("Missing access token. Please reinstall the app.", {
        status: 401,
      });
    }

    // We need a user ID for createdById — find the org admin
    const orgAdmin = await prisma.user.findFirst({
      where: { organizationId },
      select: { id: true },
    });

    if (!orgAdmin) {
      return apiError("No user found for this organization", { status: 500 });
    }

    // Sync customers
    let customersSynced = 0;
    let ordersSynced = 0;

    const customersRes = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/customers.json?limit=250`,
      {
        headers: { "X-Shopify-Access-Token": accessToken },
      },
    );

    if (customersRes.ok) {
      const { customers } = await customersRes.json();

      for (const customer of customers || []) {
        try {
          await prisma.customer.upsert({
            where: {
              shopifyId_organizationId: {
                shopifyId: customer.id.toString(),
                organizationId,
              },
            },
            create: {
              shopifyId: customer.id.toString(),
              externalId: customer.id.toString(),
              source: "SHOPIFY",
              email: customer.email || null,
              firstName: customer.first_name || "Unknown",
              lastName: customer.last_name || "",
              phone: customer.phone || null,
              totalSpent: parseFloat(customer.total_spent || "0"),
              orderCount: customer.orders_count || 0,
              organizationId,
              createdById: orgAdmin.id,
            },
            update: {
              externalId: customer.id.toString(),
              source: "SHOPIFY",
              email: customer.email || null,
              firstName: customer.first_name || "Unknown",
              lastName: customer.last_name || "",
              phone: customer.phone || null,
              totalSpent: parseFloat(customer.total_spent || "0"),
              orderCount: customer.orders_count || 0,
            },
          });
          customersSynced++;
        } catch {
          // Skip individual customer errors
        }
      }
    }

    // Sync orders
    const ordersRes = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders.json?limit=250&status=any`,
      {
        headers: { "X-Shopify-Access-Token": accessToken },
      },
    );

    if (ordersRes.ok) {
      const { orders } = await ordersRes.json();

      for (const order of orders || []) {
        try {
          // Find the customer for this order
          let customer = null;
          if (order.customer?.id) {
            customer = await prisma.customer.findFirst({
              where: {
                shopifyId: order.customer.id.toString(),
                organizationId,
              },
            });
          }
          if (!customer && order.customer?.email) {
            customer = await prisma.customer.findFirst({
              where: {
                email: { equals: order.customer.email, mode: "insensitive" },
                organizationId,
              },
            });
          }

          if (!customer) continue; // Skip orders without matching customers

          await prisma.order.upsert({
            where: {
              shopifyOrderId: order.id.toString(),
            },
            create: {
              shopifyOrderId: order.id.toString(),
              externalId: order.id.toString(),
              source: "SHOPIFY",
              orderNumber: order.name || order.order_number?.toString(),
              customerId: customer.id,
              status: order.cancelled_at
                ? "CANCELLED"
                : order.fulfillment_status === "fulfilled"
                  ? "FULFILLED"
                  : "PENDING",
              financialStatus: order.financial_status,
              fulfillmentStatus: order.fulfillment_status,
              subtotal: parseFloat(order.subtotal_price || "0"),
              tax: parseFloat(order.total_tax || "0"),
              shipping: parseFloat(
                order.total_shipping_price_set?.shop_money?.amount || "0",
              ),
              discount: parseFloat(order.total_discounts || "0"),
              total: parseFloat(order.total_price || "0"),
              totalAmount: parseFloat(order.total_price || "0"),
              items: order.line_items,
              orderDate: order.created_at
                ? new Date(order.created_at)
                : new Date(),
              organizationId,
            },
            update: {
              status: order.cancelled_at
                ? "CANCELLED"
                : order.fulfillment_status === "fulfilled"
                  ? "FULFILLED"
                  : "PENDING",
              financialStatus: order.financial_status,
              fulfillmentStatus: order.fulfillment_status,
              total: parseFloat(order.total_price || "0"),
              totalAmount: parseFloat(order.total_price || "0"),
            },
          });
          ordersSynced++;
        } catch {
          // Skip individual order errors
        }
      }
    }

    // Update integration lastSynced
    await prisma.integration.update({
      where: { id: integration.id },
      data: { updatedAt: new Date() },
    });

    logger.info("Embedded app sync completed", {
      route: "shopify-sync",
      shop,
      customersSynced,
      ordersSynced,
    });

    return apiSuccess({
      synced: {
        customers: customersSynced,
        orders: ordersSynced,
      },
    });
  } catch (error) {
    logger.error("Embedded sync error", { route: "shopify-sync", shop }, error);
    return apiError("Sync failed", { status: 500 });
  }
}
