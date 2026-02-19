import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { LoyaltyNotificationsService } from "@/services/loyalty-notifications.service";

export const POST = withApiHandler(
  async (_req: NextRequest, { session, organizationId: orgId, requestId }: ApiContext) => {
    // Get organization's Shopify integration
    const integration = await prisma.integration.findFirst({
      where: {
        organizationId: orgId,
        platform: "SHOPIFY",
        isActive: true,
      },
    });

    let shopDomain: string | null = null;
    let accessToken: string | null = null;

    if (integration) {
      const credentials = integration.credentials as any;
      shopDomain = credentials.shop;
      accessToken = credentials.accessToken;
    }

    // Get all customers with email or phone who are not already enrolled
    const customers = await prisma.customer.findMany({
      where: {
        organizationId: orgId,
        loyaltyMember: false,
        OR: [
          { email: { not: "" } },
          { phone: { not: "" } },
        ],
      },
    });

    let enrolled = 0;
    let skipped = 0;
    let failed = 0;
    let pointsAllocated = 0;

    for (const customer of customers) {
      try {
        if (!customer.email && !customer.phone) {
          skipped++;
          continue;
        }
        let totalSpent = customer.totalSpent || 0;
        let orderCount = customer.orderCount || 0;

        // Try to fetch Shopify data if customer has shopifyId and integration available
        if (customer.shopifyId && shopDomain && accessToken) {
          try {
            const ordersUrl = `https://${shopDomain}/admin/api/2025-01/customers/${customer.shopifyId}/orders.json`;
            const ordersRes = await fetch(ordersUrl, {
              headers: { "X-Shopify-Access-Token": accessToken },
            });

            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              const orders = ordersData.orders || [];

              totalSpent = orders.reduce(
                (sum: number, order: any) =>
                  sum + parseFloat(order.total_price || 0),
                0,
              );
              orderCount = orders.length;

              for (const order of orders) {
                const orderTotal = parseFloat(order.total_price || 0);
                const pointsEarned = Math.floor(orderTotal);

                if (pointsEarned > 0) {
                  try {
                    await prisma.customerActivity.create({
                      data: {
                        customerId: customer.id,
                        type: "PURCHASE",
                        description: `Shopify Order #${
                          order.order_number || order.id
                        }`,
                        pointsEarned,
                        metadata: {
                          shopifyOrderId: order.id,
                          orderNumber: order.order_number,
                          orderName: order.name,
                          totalPrice: order.total_price,
                          createdAt: order.created_at,
                          lineItems: order.line_items?.length || 0,
                        },
                        createdAt: order.created_at
                          ? new Date(order.created_at)
                          : new Date(),
                        organizationId: orgId,
                      },
                    });
                  } catch (_activityErr) {
                    // Skip individual activity creation errors
                  }
                }
              }
            }
          } catch (_err) {
            // Continue with existing data if Shopify fetch fails
          }
        }

        // Update customer with loyalty status
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            loyaltyMember: true,
            loyaltyTier: "BRONZE",
            loyaltyPoints: 0,
            totalSpent,
            orderCount,
          },
        });

        enrolled++;
      } catch (_customerError) {
        failed++;
      }
    }

    return apiSuccess({
      success: true,
      enrolled,
      skipped,
      failed,
      pointsAllocated,
    }, { requestId });
  },
  { route: 'POST /api/loyalty/auto-enroll', rateLimit: RATE_LIMITS.standard }
);
