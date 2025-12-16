import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WebhookLogger } from "@/lib/webhook-logger";
import crypto from "crypto";

function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Shopify Orders Webhook] SHOPIFY_WEBHOOK_SECRET not configured");
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
  let webhookLog: { id: string; startTime: number } | null = null;

  try {
    const hmac = req.headers.get("x-shopify-hmac-sha256");
    const shop = req.headers.get("x-shopify-shop-domain");
    const topic = req.headers.get("x-shopify-topic");
    const body = await req.text();

    const order = JSON.parse(body);

    // Log webhook received
    webhookLog = await WebhookLogger.logReceived({
      platform: "SHOPIFY",
      topic: topic || "orders/unknown",
      shopDomain: shop,
      externalId: order.id?.toString(),
      headers: { topic: topic || "", shop: shop || "" },
    });

    if (!hmac || !verifyShopifyWebhook(body, hmac)) {
      console.error("[Shopify Orders Webhook] Invalid signature");
      await WebhookLogger.logFailure(webhookLog.id, webhookLog.startTime, "Invalid signature", "401");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(`[Shopify Orders Webhook] Received ${topic} from ${shop}`);

    await WebhookLogger.logProcessing(webhookLog.id);

    const integration = await prisma.integration.findFirst({
      where: {
        platform: "SHOPIFY",
        credentials: { path: ["shop"], equals: shop },
      },
    });

    if (!integration) {
      console.error(
        "[Shopify Orders Webhook] Integration not found for shop:",
        shop
      );
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    console.log(
      "[Shopify Orders Webhook] Processing order:",
      order.id,
      "for org:",
      integration.organizationId
    );

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        email: order.email,
        organizationId: integration.organizationId,
      },
    });

    // Build customer address from order data
    const customerAddress = order.customer?.default_address || order.shipping_address || order.billing_address;
    const customerAddressString = customerAddress
      ? [
          customerAddress.address1,
          customerAddress.address2,
          customerAddress.city,
          customerAddress.province,
          customerAddress.zip,
          customerAddress.country,
        ]
          .filter(Boolean)
          .join(", ")
      : null;

    if (!customer && order.customer) {
      console.log(
        "[Shopify Orders Webhook] Creating new customer:",
        order.email
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
          address: customerAddressString,
          // Marketing preferences from Shopify
          emailOptIn: order.customer.accepts_marketing ?? true,
          smsOptIn: order.customer.accepts_marketing_updated_at ? order.customer.accepts_marketing : true,
        },
      });
    } else if (customer && customerAddressString && !customer.address) {
      // Update existing customer with address if missing
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { address: customerAddressString },
      });
    }

    if (!customer) {
      console.error(
        "[Shopify Orders Webhook] Could not find or create customer for order:",
        order.id
      );
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
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
      orderStatus
    );

    // Extract shipping address
    const shippingAddress = order.shipping_address || {};

    // Extract billing address
    const billingAddress = order.billing_address || {};

    // Extract line items with product details
    const lineItems = order.line_items?.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      title: item.title,
      variantTitle: item.variant_title,
      sku: item.sku,
      quantity: item.quantity,
      price: parseFloat(item.price || "0"),
      totalDiscount: parseFloat(item.total_discount || "0"),
      fulfillmentStatus: item.fulfillment_status,
      vendor: item.vendor,
      grams: item.grams,
      taxable: item.taxable,
    })) || [];

    // Extract discount codes
    const discountCodes = order.discount_codes?.map((dc: any) => ({
      code: dc.code,
      amount: parseFloat(dc.amount || "0"),
      type: dc.type,
    })) || [];

    // Extract shipping method
    const shippingMethod = order.shipping_lines?.[0]?.title || null;
    const shippingCost = order.shipping_lines?.reduce(
      (sum: number, line: any) => sum + parseFloat(line.price || "0"),
      0
    ) || 0;

    // Extract transactions (payment info)
    const transactions = order.transactions?.map((tx: any) => ({
      id: tx.id,
      kind: tx.kind,
      status: tx.status,
      amount: parseFloat(tx.amount || "0"),
      gateway: tx.gateway,
      createdAt: tx.created_at,
      errorCode: tx.error_code,
      authorization: tx.authorization,
    })) || [];

    // Extract fulfillment/tracking info
    const fulfillment = order.fulfillments?.[0];
    const trackingNumber = fulfillment?.tracking_number || null;
    const trackingUrl = fulfillment?.tracking_url || null;
    const trackingCompany = fulfillment?.tracking_company || null;
    const fulfilledAt = fulfillment?.created_at ? new Date(fulfillment.created_at) : null;

    // Extract payment gateway
    const gateway = order.gateway || order.payment_gateway_names?.[0] || null;

    // Upsert order with complete data
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
        status: orderStatus,
        organizationId: integration.organizationId,
        source: "SHOPIFY",
        orderDate: new Date(order.created_at),
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,

        // Amounts
        subtotal: parseFloat(order.subtotal_price || "0"),
        tax: parseFloat(order.total_tax || "0"),
        shipping: shippingCost,
        discount: parseFloat(order.total_discounts || "0"),
        total: parseFloat(order.total_price || "0"),
        totalAmount: parseFloat(order.total_price || "0"),
        currency: order.currency || "USD",

        // Line items and discount codes
        items: lineItems,
        discountCodes: discountCodes.length > 0 ? discountCodes : null,

        // Shipping address
        shippingFirstName: shippingAddress.first_name,
        shippingLastName: shippingAddress.last_name,
        shippingCompany: shippingAddress.company,
        shippingAddress1: shippingAddress.address1,
        shippingAddress2: shippingAddress.address2,
        shippingCity: shippingAddress.city,
        shippingProvince: shippingAddress.province,
        shippingProvinceCode: shippingAddress.province_code,
        shippingCountry: shippingAddress.country,
        shippingCountryCode: shippingAddress.country_code,
        shippingZip: shippingAddress.zip,
        shippingPhone: shippingAddress.phone,
        shippingMethod: shippingMethod,

        // Billing address
        billingFirstName: billingAddress.first_name,
        billingLastName: billingAddress.last_name,
        billingCompany: billingAddress.company,
        billingAddress1: billingAddress.address1,
        billingAddress2: billingAddress.address2,
        billingCity: billingAddress.city,
        billingProvince: billingAddress.province,
        billingProvinceCode: billingAddress.province_code,
        billingCountry: billingAddress.country,
        billingCountryCode: billingAddress.country_code,
        billingZip: billingAddress.zip,
        billingPhone: billingAddress.phone,

        // Fulfillment/Tracking
        trackingNumber,
        trackingUrl,
        trackingCompany,
        fulfilledAt,

        // Transaction info
        transactions: transactions.length > 0 ? transactions : null,
        gateway,

        // Customer note
        note: order.note,
      },
      update: {
        orderNumber: order.order_number?.toString() || order.name,
        status: orderStatus,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,

        // Update amounts
        subtotal: parseFloat(order.subtotal_price || "0"),
        tax: parseFloat(order.total_tax || "0"),
        shipping: shippingCost,
        discount: parseFloat(order.total_discounts || "0"),
        total: parseFloat(order.total_price || "0"),
        totalAmount: parseFloat(order.total_price || "0"),
        currency: order.currency || "USD",

        // Update line items and discount codes
        items: lineItems,
        discountCodes: discountCodes.length > 0 ? discountCodes : null,

        // Update shipping address
        shippingFirstName: shippingAddress.first_name,
        shippingLastName: shippingAddress.last_name,
        shippingCompany: shippingAddress.company,
        shippingAddress1: shippingAddress.address1,
        shippingAddress2: shippingAddress.address2,
        shippingCity: shippingAddress.city,
        shippingProvince: shippingAddress.province,
        shippingProvinceCode: shippingAddress.province_code,
        shippingCountry: shippingAddress.country,
        shippingCountryCode: shippingAddress.country_code,
        shippingZip: shippingAddress.zip,
        shippingPhone: shippingAddress.phone,
        shippingMethod: shippingMethod,

        // Update billing address
        billingFirstName: billingAddress.first_name,
        billingLastName: billingAddress.last_name,
        billingCompany: billingAddress.company,
        billingAddress1: billingAddress.address1,
        billingAddress2: billingAddress.address2,
        billingCity: billingAddress.city,
        billingProvince: billingAddress.province,
        billingProvinceCode: billingAddress.province_code,
        billingCountry: billingAddress.country,
        billingCountryCode: billingAddress.country_code,
        billingZip: billingAddress.zip,
        billingPhone: billingAddress.phone,

        // Update fulfillment/tracking
        trackingNumber,
        trackingUrl,
        trackingCompany,
        fulfilledAt,

        // Update transaction info
        transactions: transactions.length > 0 ? transactions : null,
        gateway,

        // Update customer note
        note: order.note,
      },
    });

    console.log(
      "[Shopify Orders Webhook] Order processed successfully:",
      upsertedOrder.id
    );

    // Update customer statistics (totalSpent, orderCount, lastOrderAt) and award loyalty points
    if (customer && order.financial_status === "paid") {
      // Calculate total spent from all paid orders
      const customerOrders = await prisma.order.aggregate({
        where: {
          customerId: customer.id,
          financialStatus: { in: ["paid", "partially_refunded"] },
        },
        _sum: { total: true },
        _count: true,
      });

      // Award loyalty points: 1 point per $1 spent (only for new orders, not updates)
      const orderTotal = parseFloat(order.total_price || "0");
      const pointsToAward = Math.floor(orderTotal); // 1 point per $1 spent

      // Check if this is a new order (not an update) by comparing order count
      const isNewOrder = (customerOrders._count || 0) > (customer.orderCount || 0);

      const updateData: {
        totalSpent: number;
        orderCount: number;
        lastOrderAt: Date;
        loyaltyPoints?: number;
        loyaltyMember?: boolean;
      } = {
        totalSpent: customerOrders._sum.total || 0,
        orderCount: customerOrders._count || 0,
        lastOrderAt: new Date(order.created_at),
      };

      // Only award points for new paid orders (not order updates)
      if (isNewOrder && pointsToAward > 0) {
        updateData.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsToAward;
        updateData.loyaltyMember = true; // Auto-enroll in loyalty program on first purchase
        console.log(
          `[Shopify Orders Webhook] Awarding ${pointsToAward} loyalty points to customer ${customer.id} for order $${orderTotal}`
        );
      }

      await prisma.customer.update({
        where: { id: customer.id },
        data: updateData,
      });

      console.log(
        `[Shopify Orders Webhook] Customer ${customer.id} stats updated - totalSpent: $${customerOrders._sum.total}, orders: ${customerOrders._count}, loyaltyPoints: ${updateData.loyaltyPoints || customer.loyaltyPoints}`
      );
    }

    // Log successful processing
    if (webhookLog) {
      await WebhookLogger.logSuccess(webhookLog.id, webhookLog.startTime, integration.organizationId);
    }

    return NextResponse.json({
      success: true,
      orderId: upsertedOrder.id,
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error("[Shopify Orders Webhook] Error:", error);

    // Log failure
    if (webhookLog) {
      await WebhookLogger.logFailure(webhookLog.id, webhookLog.startTime, error, "500");
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
