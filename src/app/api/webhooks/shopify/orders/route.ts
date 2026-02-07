import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { LoyaltyNotificationsService } from "@/services/loyalty-notifications.service";

function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const hash = crypto
    .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(body, "utf8")
    .digest("base64");
  return hash === hmac;
}

export async function POST(req: NextRequest) {
  try {
    const hmac = req.headers.get("x-shopify-hmac-sha256");
    const shop = req.headers.get("x-shopify-shop-domain");
    const topic = req.headers.get("x-shopify-topic");
    const body = await req.text();

    if (!hmac || !verifyShopifyWebhook(body, hmac)) {
      console.error("[Shopify Orders Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(`[Shopify Orders Webhook] Received ${topic} from ${shop}`);

    const order = JSON.parse(body);

    const integration = await prisma.integration.findFirst({
      where: {
        platform: "SHOPIFY",
        credentials: { path: ["shop"], equals: shop },
      },
    });

    if (!integration) {
      console.error(
        "[Shopify Orders Webhook] Integration not found for shop:",
        shop,
      );
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    console.log(
      "[Shopify Orders Webhook] Processing order:",
      order.id,
      "for org:",
      integration.organizationId,
    );

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        email: order.email,
        organizationId: integration.organizationId,
      },
    });

    if (!customer && order.customer) {
      console.log(
        "[Shopify Orders Webhook] Creating new customer:",
        order.email,
      );
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
          organizationId: integration.organizationId,
          source: "SHOPIFY",
          externalId: order.customer.id?.toString(),
          shopifyId: order.customer.id?.toString(),
        },
      });
    }

    if (!customer) {
      console.error(
        "[Shopify Orders Webhook] Could not find or create customer for order:",
        order.id,
      );
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Determine order status based on financial and fulfillment status
    let orderStatus = "pending";
    if (order.cancelled_at) {
      orderStatus = "cancelled";
    } else if (order.fulfillment_status === "fulfilled") {
      orderStatus = "completed";
    } else if (order.financial_status === "paid") {
      orderStatus = "paid";
    } else if (
      order.financial_status === "refunded" ||
      order.financial_status === "partially_refunded"
    ) {
      orderStatus = "refunded";
    }

    console.log(
      "[Shopify Orders Webhook] Upserting order with status:",
      orderStatus,
    );

    // Upsert order
    const upsertedOrder = await prisma.order.upsert({
      where: {
        externalId_organizationId: {
          externalId: order.id.toString(),
          organizationId: integration.organizationId,
        },
      },
      create: {
        customerId: customer.id,
        externalId: order.id.toString(),
        orderNumber: order.order_number?.toString() || order.name,
        totalAmount: parseFloat(order.total_price || "0"),
        status: orderStatus,
        organizationId: integration.organizationId,
        source: "SHOPIFY",
        orderDate: new Date(order.created_at),
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
      },
      update: {
        orderNumber: order.order_number?.toString() || order.name,
        totalAmount: parseFloat(order.total_price || "0"),
        status: orderStatus,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
      },
    });

    console.log(
      "[Shopify Orders Webhook] Order processed successfully:",
      upsertedOrder.id,
    );

    // Award loyalty points if customer is a loyalty member and order is paid/completed
    if (
      customer.loyaltyMember &&
      (orderStatus === "paid" || orderStatus === "completed") &&
      order.financial_status !== "refunded" &&
      order.financial_status !== "partially_refunded"
    ) {
      try {
        const pointsToAward = Math.floor(parseFloat(order.total_price || "0"));

        if (pointsToAward > 0) {
          // Update customer points
          const updatedCustomer = await prisma.customer.update({
            where: { id: customer.id },
            data: {
              loyaltyPoints: {
                increment: pointsToAward,
              },
              totalSpent: {
                increment: parseFloat(order.total_price || "0"),
              },
            },
            select: {
              loyaltyPoints: true,
            },
          });

          console.log(
            `[Shopify Orders Webhook] Awarded ${pointsToAward} points to customer ${customer.id}`,
          );

          // Send SMS notification (non-blocking)
          LoyaltyNotificationsService.sendPointsEarnedSms({
            customerId: customer.id,
            pointsEarned: pointsToAward,
            newBalance: updatedCustomer.loyaltyPoints,
            reason: `Order #${order.order_number || order.name}`,
            organizationId: integration.organizationId,
          }).catch((err) =>
            console.error(
              "[Shopify Orders Webhook] Failed to send SMS notification:",
              err,
            ),
          );
        }
      } catch (pointsError) {
        console.error(
          "[Shopify Orders Webhook] Error awarding points:",
          pointsError,
        );
        // Don't fail the webhook if points award fails
      }
    }

    return NextResponse.json({
      success: true,
      orderId: upsertedOrder.id,
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error("[Shopify Orders Webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
