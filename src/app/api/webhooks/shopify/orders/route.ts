import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { LoyaltyNotificationsService } from "@/services/loyalty-notifications.service";
import { TierPromotionService } from "@/services/tier-promotion.service";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const hash = crypto
    .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(body, "utf8")
    .digest("base64");
  return hash === hmac;
}

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const hmac = req.headers.get("x-shopify-hmac-sha256");
    const shop = req.headers.get("x-shopify-shop-domain");
    const topic = req.headers.get("x-shopify-topic");
    const body = await req.text();

    if (!hmac || !verifyShopifyWebhook(body, hmac)) {
      return apiError("Invalid signature", { status: 401, requestId });
    }

    logger.info(`Received ${topic} from ${shop}`, {
      route: "POST /api/webhooks/shopify/orders",
      topic,
      shop,
    });

    const order = JSON.parse(body);

    const integration = await prisma.integration.findFirst({
      where: {
        platform: "SHOPIFY",
        credentials: { path: ["shop"], equals: shop as string },
      },
    });

    if (!integration) {
      return apiError("Integration not found", { status: 404, requestId });
    }

    logger.info("Processing order", {
      route: "POST /api/webhooks/shopify/orders",
      orderId: order.id,
      organizationId: integration.organizationId,
    });

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        email: order.email,
        organizationId: integration.organizationId,
      },
    });

    if (!customer && order.customer) {
      logger.info("Creating new customer", {
        route: "POST /api/webhooks/shopify/orders",
        email: order.email,
      });
      customer = await prisma.customer.create({
        data: {
          email: order.email,
          firstName:
            order.customer.first_name ||
            order.billing_address?.first_name ||
            "Unknown",
          lastName:
            order.customer.last_name || order.billing_address?.last_name || "",
          phone: order.customer.phone || order.billing_address?.phone,
          organizationId: integration.organizationId!,
          source: "SHOPIFY",
          externalId: order.customer.id?.toString(),
          shopifyId: order.customer.id?.toString(),
          createdById:
            (integration as any).userId || integration.organizationId!,
        } as any,
      });
    }

    if (!customer) {
      return apiError("Customer not found", { status: 404, requestId });
    }

    // Determine order status based on financial and fulfillment status
    let orderStatus: string = "PENDING";
    if (order.cancelled_at) {
      orderStatus = "CANCELLED";
    } else if (order.fulfillment_status === "fulfilled") {
      orderStatus = "FULFILLED";
    } else if (order.financial_status === "paid") {
      orderStatus = "PAID";
    } else if (
      order.financial_status === "refunded" ||
      order.financial_status === "partially_refunded"
    ) {
      orderStatus = "REFUNDED";
    }

    logger.info("Upserting order with status", {
      route: "POST /api/webhooks/shopify/orders",
      orderStatus,
    });

    // Upsert order
    const upsertedOrder = await prisma.order.upsert({
      where: {
        externalId_organizationId: {
          externalId: order.id.toString(),
          organizationId: integration.organizationId!,
        },
      },
      create: {
        customerId: customer.id,
        externalId: order.id.toString(),
        orderNumber: order.order_number?.toString() || order.name,
        totalAmount: parseFloat(order.total_price || "0"),
        status: orderStatus as any,
        organizationId: integration.organizationId!,
        source: "SHOPIFY",
        orderDate: new Date(order.created_at),
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
      },
      update: {
        orderNumber: order.order_number?.toString() || order.name,
        totalAmount: parseFloat(order.total_price || "0"),
        status: orderStatus as any,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
      },
    });

    logger.info("Order processed successfully", {
      route: "POST /api/webhooks/shopify/orders",
      orderId: upsertedOrder.id,
    });

    // Mark any abandoned carts for this customer as recovered
    try {
      const recoveredCarts = await prisma.abandonedCart.updateMany({
        where: {
          customerId: customer.id,
          organizationId: integration.organizationId!,
          recovered: false,
        },
        data: {
          recovered: true,
          recoveredAt: new Date(),
        },
      });

      if (recoveredCarts.count > 0) {
        logger.info(
          `Marked ${recoveredCarts.count} abandoned cart(s) as recovered`,
          {
            route: "POST /api/webhooks/shopify/orders",
            customerId: customer.id,
            recoveredCount: recoveredCarts.count,
          },
        );
      }
    } catch (cartError) {
      logger.error(
        "Error updating abandoned carts",
        { route: "POST /api/webhooks/shopify/orders", customerId: customer.id },
        cartError as Error,
      );
      // Non-critical — don't fail the webhook
    }

    // Update totalSpent, orderCount, and lastOrderAt for ALL customers (not just loyalty members)
    if (
      (orderStatus === "PAID" || orderStatus === "FULFILLED") &&
      order.financial_status !== "refunded" &&
      order.financial_status !== "partially_refunded"
    ) {
      try {
        const orderTotal = parseFloat(order.total_price || "0");

        // Recalculate totalSpent and orderCount from all orders for accuracy
        const orderAgg = await prisma.order.aggregate({
          where: { customerId: customer.id },
          _sum: { totalAmount: true },
          _count: true,
        });

        const latestOrder = await prisma.order.findFirst({
          where: { customerId: customer.id },
          orderBy: { orderDate: "desc" },
          select: { orderDate: true },
        });

        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            totalSpent: orderAgg._sum.totalAmount || 0,
            orderCount: orderAgg._count || 0,
            lastOrderAt: latestOrder?.orderDate || new Date(order.created_at),
          },
        });

        logger.info(`Updated customer stats`, {
          route: "POST /api/webhooks/shopify/orders",
          customerId: customer.id,
          totalSpent: orderAgg._sum.totalAmount,
          orderCount: orderAgg._count,
        });

        // Award loyalty points if customer is a loyalty member
        if (customer.loyaltyMember) {
          const pointsToAward = Math.floor(orderTotal);

          if (pointsToAward > 0) {
            const updatedCustomer = await prisma.customer.update({
              where: { id: customer.id },
              data: {
                loyaltyPoints: {
                  increment: pointsToAward,
                },
              },
              select: {
                loyaltyPoints: true,
              },
            });

            logger.info(`Awarded ${pointsToAward} points`, {
              route: "POST /api/webhooks/shopify/orders",
              customerId: customer.id,
              pointsToAward,
            });

            // Send SMS notification (non-blocking)
            LoyaltyNotificationsService.sendPointsEarnedSms({
              customerId: customer.id,
              pointsEarned: pointsToAward,
              newBalance: updatedCustomer.loyaltyPoints,
              reason: `Order #${order.order_number || order.name}`,
              organizationId: integration.organizationId!,
            }).catch((err) =>
              logger.error(
                "Failed to send SMS notification",
                {
                  route: "POST /api/webhooks/shopify/orders",
                  customerId: customer.id,
                },
                err,
              ),
            );

            // Check for tier promotion & award discount code (non-blocking)
            TierPromotionService.checkAndPromote({
              customerId: customer.id,
              currentPoints: updatedCustomer.loyaltyPoints,
              organizationId: integration.organizationId!,
            })
              .then((result) => {
                if (result.promoted) {
                  logger.info(
                    `Customer promoted: ${result.previousTier} → ${result.newTier}`,
                    {
                      route: "POST /api/webhooks/shopify/orders",
                      customerId: customer.id,
                      previousTier: result.previousTier,
                      newTier: result.newTier,
                      discountCode: result.discountCode,
                    },
                  );
                }
              })
              .catch((err) =>
                logger.error(
                  "Tier promotion check failed",
                  {
                    route: "POST /api/webhooks/shopify/orders",
                    customerId: customer.id,
                  },
                  err,
                ),
              );
          }
        }
      } catch (statsError) {
        logger.error(
          "Error updating customer stats",
          {
            route: "POST /api/webhooks/shopify/orders",
            customerId: customer.id,
          },
          statsError as Error,
        );
        // Don't fail the webhook if stats update fails
      }
    }

    return apiSuccess(
      {
        success: true,
        orderId: upsertedOrder.id,
        customerId: customer.id,
      },
      { requestId },
    );
  },
  { route: "POST /api/webhooks/shopify/orders" },
);
