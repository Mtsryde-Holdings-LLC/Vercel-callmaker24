import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Verify Shopify webhook signature
function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Shopify Compliance Webhook] SHOPIFY_WEBHOOK_SECRET not configured");
    return false;
  }
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const hmac = req.headers.get("x-shopify-hmac-sha256");
    const shop = req.headers.get("x-shopify-shop-domain");
    const topic = req.headers.get("x-shopify-topic");
    const body = await req.text();

    // Verify webhook authenticity
    if (!hmac || !verifyShopifyWebhook(body, hmac)) {
      console.error("[Shopify Compliance Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log(`[Shopify Compliance Webhook] Received ${topic} from ${shop}`);

    switch (topic) {
      case "customers/data_request":
        await handleCustomerDataRequest(payload, shop);
        break;

      case "customers/redact":
        await handleCustomerRedact(payload, shop);
        break;

      case "shop/redact":
        await handleShopRedact(payload, shop);
        break;

      default:
        console.log(`[Shopify Compliance Webhook] Unhandled topic: ${topic}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Shopify Compliance Webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Handle customers/data_request webhook
 * Shopify sends this when a customer requests their data under GDPR
 * You must respond with the customer's data or confirm you have none
 */
async function handleCustomerDataRequest(
  payload: {
    shop_id: number;
    shop_domain: string;
    orders_requested: number[];
    customer: {
      id: number;
      email: string;
      phone: string;
    };
    data_request: {
      id: number;
    };
  },
  shop: string | null
) {
  console.log(`[Shopify Compliance] Customer data request for ${payload.customer.email}`);

  // Find the integration
  const integration = await prisma.integration.findFirst({
    where: {
      platform: "SHOPIFY",
      credentials: { path: ["shop"], equals: shop },
    },
  });

  if (!integration) {
    console.log("[Shopify Compliance] No integration found for shop:", shop);
    return;
  }

  // Find customer data in our system
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { shopifyId: payload.customer.id.toString(), organizationId: integration.organizationId },
        { email: payload.customer.email, organizationId: integration.organizationId },
      ],
    },
    include: {
      orders: true,
    },
  });

  if (customer) {
    // Log the data request for compliance records
    console.log(`[Shopify Compliance] Found customer data for ${payload.customer.email}:`, {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      ordersCount: customer.orders?.length || 0,
    });

    // In production, you would:
    // 1. Compile all customer data
    // 2. Send it to the merchant or directly to Shopify
    // 3. Log the request for audit purposes
  } else {
    console.log(`[Shopify Compliance] No customer data found for ${payload.customer.email}`);
  }
}

/**
 * Handle customers/redact webhook
 * Shopify sends this when a store owner requests deletion of customer data
 * You must delete all customer data from your systems
 */
async function handleCustomerRedact(
  payload: {
    shop_id: number;
    shop_domain: string;
    customer: {
      id: number;
      email: string;
      phone: string;
    };
    orders_to_redact: number[];
  },
  shop: string | null
) {
  console.log(`[Shopify Compliance] Customer redact request for ${payload.customer.email}`);

  // Find the integration
  const integration = await prisma.integration.findFirst({
    where: {
      platform: "SHOPIFY",
      credentials: { path: ["shop"], equals: shop },
    },
  });

  if (!integration) {
    console.log("[Shopify Compliance] No integration found for shop:", shop);
    return;
  }

  // Find and delete/anonymize customer data
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { shopifyId: payload.customer.id.toString(), organizationId: integration.organizationId },
        { email: payload.customer.email, organizationId: integration.organizationId },
      ],
    },
  });

  if (customer) {
    // Anonymize customer data instead of hard delete to maintain order integrity
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        email: `redacted-${customer.id}@redacted.local`,
        firstName: "REDACTED",
        lastName: "REDACTED",
        phone: null,
        address: null,
        company: null,
        notes: "Customer data redacted per GDPR request",
        shopifyId: null,
        externalId: null,
        deletedAt: new Date(),
      },
    });

    // Anonymize order data for specified orders
    if (payload.orders_to_redact && payload.orders_to_redact.length > 0) {
      await prisma.order.updateMany({
        where: {
          customerId: customer.id,
          externalId: { in: payload.orders_to_redact.map(String) },
        },
        data: {
          shippingFirstName: "REDACTED",
          shippingLastName: "REDACTED",
          shippingPhone: null,
          shippingAddress1: "REDACTED",
          shippingAddress2: null,
          billingFirstName: "REDACTED",
          billingLastName: "REDACTED",
          billingPhone: null,
          billingAddress1: "REDACTED",
          billingAddress2: null,
          note: null,
        },
      });
    }

    console.log(`[Shopify Compliance] Customer ${customer.id} data redacted`);
  } else {
    console.log(`[Shopify Compliance] No customer found to redact for ${payload.customer.email}`);
  }
}

/**
 * Handle shop/redact webhook
 * Shopify sends this 48 hours after a store uninstalls your app
 * You must delete all data associated with that shop
 */
async function handleShopRedact(
  payload: {
    shop_id: number;
    shop_domain: string;
  },
  shop: string | null
) {
  console.log(`[Shopify Compliance] Shop redact request for ${payload.shop_domain}`);

  // Find the integration
  const integration = await prisma.integration.findFirst({
    where: {
      platform: "SHOPIFY",
      credentials: { path: ["shop"], equals: shop || payload.shop_domain },
    },
  });

  if (!integration) {
    console.log("[Shopify Compliance] No integration found for shop:", shop);
    return;
  }

  const organizationId = integration.organizationId;

  // Delete all shop data in order (respecting foreign key constraints)

  // 1. Delete webhook logs
  await prisma.webhookLog.deleteMany({
    where: { organizationId },
  });

  // 2. Delete abandoned carts
  await prisma.abandonedCart.deleteMany({
    where: { organizationId },
  });

  // 3. Delete orders
  await prisma.order.deleteMany({
    where: { organizationId, source: "SHOPIFY" },
  });

  // 4. Delete customers from Shopify
  await prisma.customer.deleteMany({
    where: { organizationId, source: "SHOPIFY" },
  });

  // 5. Delete products from Shopify
  await prisma.product.deleteMany({
    where: { organizationId },
  });

  // 6. Delete the integration itself
  await prisma.integration.delete({
    where: { id: integration.id },
  });

  console.log(`[Shopify Compliance] All data for shop ${payload.shop_domain} has been deleted`);
}
