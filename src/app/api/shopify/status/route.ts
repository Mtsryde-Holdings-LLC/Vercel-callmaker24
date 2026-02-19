/**
 * GET /api/shopify/status
 *
 * Returns the connection status of a Shopify shop.
 * Used by the embedded app page to check if the shop is connected.
 *
 * Accepts either:
 * - App Bridge session token (Authorization: Bearer <token>)
 * - Query param: ?shop=xxx (for initial load before App Bridge is ready)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { authenticateShopifyRequest } from "@/lib/shopify/session-token";
import { isValidShopDomain } from "@/lib/shopify/verify-request";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Try to authenticate via session token first
  const sessionAuth = await authenticateShopifyRequest(request);
  let shop = sessionAuth?.shop;

  // Fall back to query parameter
  if (!shop) {
    shop = request.nextUrl.searchParams.get("shop") || "";
  }

  if (!shop || !isValidShopDomain(shop)) {
    return apiError("Invalid or missing shop parameter", { status: 400 });
  }

  try {
    // Find the integration for this shop
    const integration = await prisma.integration.findFirst({
      where: {
        platform: "SHOPIFY",
        isActive: true,
        credentials: { path: ["shop"], equals: shop },
      },
      include: {
        organization: {
          select: {
            id: true,
            subscriptionTier: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!integration) {
      return apiError("Shop not connected", { status: 401 });
    }

    // Get synced counts
    const [customerCount, orderCount] = await Promise.all([
      prisma.customer.count({
        where: {
          organizationId: integration.organizationId,
          source: "SHOPIFY",
        },
      }),
      prisma.order
        .count({
          where: {
            organizationId: integration.organizationId,
          },
        })
        .catch(() => 0), // Order table might not exist
    ]);

    return apiSuccess({
      connected: true,
      shop,
      syncedCustomers: customerCount,
      syncedOrders: orderCount,
      lastSync: integration.updatedAt?.toISOString() || null,
      subscriptionTier: integration.organization?.subscriptionTier || "FREE",
      subscriptionStatus:
        integration.organization?.subscriptionStatus || "INACTIVE",
    });
  } catch (error) {
    logger.error(
      "Failed to check shop status",
      { route: "shopify-status", shop },
      error,
    );
    return apiError("Internal server error", { status: 500 });
  }
}
