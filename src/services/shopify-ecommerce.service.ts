import { prisma } from "@/lib/prisma";
import { RETURN_WINDOW_DAYS } from "@/lib/constants";

/**
 * ShopifyEcommerceService
 *
 * Provides real-time ecommerce data from Shopify for chatbot interactions.
 * Handles order lookups, tracking, product search, and return requests.
 */
export class ShopifyEcommerceService {
  /**
   * Get Shopify credentials for an organization from the Integration model.
   */
  static async getShopifyCredentials(organizationId: string) {
    const integration = await prisma.integration.findFirst({
      where: {
        organizationId,
        platform: "SHOPIFY",
        isActive: true,
      },
    });

    if (!integration?.credentials) return null;

    const creds = integration.credentials as any;
    return {
      shop: creds.shop || creds.shopDomain,
      accessToken: creds.accessToken,
    };
  }

  /**
   * Fetch a single order from Shopify by order name/number (e.g., "#1042")
   */
  static async getShopifyOrder(
    shop: string,
    accessToken: string,
    orderNumber: string,
  ) {
    try {
      // Strip # prefix if present
      const cleanNumber = orderNumber.replace(/^#/, "");

      const res = await fetch(
        `https://${shop}/admin/api/2024-01/orders.json?name=%23${cleanNumber}&status=any`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) return null;

      const data = await res.json();
      return data.orders?.[0] || null;
    } catch (error) {
      console.error("[ShopifyEcommerce] Error fetching order:", error);
      return null;
    }
  }

  /**
   * Fetch fulfillments (tracking info) for a Shopify order
   */
  static async getOrderFulfillments(
    shop: string,
    accessToken: string,
    shopifyOrderId: string,
  ) {
    try {
      const res = await fetch(
        `https://${shop}/admin/api/2024-01/orders/${shopifyOrderId}/fulfillments.json`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) return [];

      const data = await res.json();
      return data.fulfillments || [];
    } catch (error) {
      console.error("[ShopifyEcommerce] Error fetching fulfillments:", error);
      return [];
    }
  }

  /**
   * Lookup all orders by customer email from Shopify
   */
  static async getOrdersByEmail(
    shop: string,
    accessToken: string,
    email: string,
  ) {
    try {
      const res = await fetch(
        `https://${shop}/admin/api/2024-01/orders.json?email=${encodeURIComponent(email)}&status=any&limit=10`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) return [];

      const data = await res.json();
      return data.orders || [];
    } catch (error) {
      console.error(
        "[ShopifyEcommerce] Error fetching orders by email:",
        error,
      );
      return [];
    }
  }

  /**
   * Full order status lookup - combines local DB + live Shopify data
   */
  static async lookupOrderStatus(params: {
    organizationId: string;
    customerId?: string;
    customerEmail?: string;
    orderNumber?: string;
  }) {
    const { organizationId, customerId, customerEmail, orderNumber } = params;

    // 1. Try local DB first
    const whereClause: any = {};
    if (orderNumber) {
      whereClause.orderNumber = orderNumber.replace(/^#/, "");
    }
    if (customerId) {
      whereClause.customerId = customerId;
    }

    const localOrders = await prisma.order.findMany({
      where: {
        ...whereClause,
        organizationId,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: orderNumber ? 1 : 10,
    });

    // 2. Try to get live data from Shopify for tracking info
    const creds = await this.getShopifyCredentials(organizationId);
    let shopifyDetails: any[] = [];

    if (creds) {
      if (orderNumber) {
        const shopifyOrder = await this.getShopifyOrder(
          creds.shop,
          creds.accessToken,
          orderNumber,
        );
        if (shopifyOrder) {
          const fulfillments = await this.getOrderFulfillments(
            creds.shop,
            creds.accessToken,
            shopifyOrder.id.toString(),
          );
          shopifyDetails = [{ ...shopifyOrder, fulfillments }];
        }
      } else if (customerEmail) {
        const shopifyOrders = await this.getOrdersByEmail(
          creds.shop,
          creds.accessToken,
          customerEmail,
        );
        shopifyDetails = shopifyOrders;
      }
    }

    // 3. Merge and format
    return this.formatOrderResults(localOrders, shopifyDetails);
  }

  /**
   * Format order results combining local DB + Shopify data
   */
  private static formatOrderResults(localOrders: any[], shopifyOrders: any[]) {
    const results: OrderResult[] = [];

    // Map shopify orders by order number for quick lookup
    const shopifyMap = new Map<string, any>();
    for (const so of shopifyOrders) {
      shopifyMap.set(so.name?.replace("#", ""), so);
    }

    // Process local orders enriched with Shopify data
    for (const lo of localOrders) {
      const shopifyData = shopifyMap.get(lo.orderNumber);
      const tracking = this.extractTracking(shopifyData);

      results.push({
        orderNumber: lo.orderNumber || lo.id.slice(-6),
        status: lo.status,
        financialStatus:
          lo.financialStatus || shopifyData?.financial_status || "unknown",
        fulfillmentStatus:
          lo.fulfillmentStatus ||
          shopifyData?.fulfillment_status ||
          "unfulfilled",
        total: lo.total || lo.totalAmount || 0,
        currency: shopifyData?.currency || "USD",
        items: this.formatLineItems(lo.items, shopifyData?.line_items),
        orderDate: lo.orderDate || lo.createdAt,
        tracking,
        customerName: lo.customer
          ? `${lo.customer.firstName || ""} ${lo.customer.lastName || ""}`.trim()
          : null,
      });
    }

    // Add any Shopify orders not in local DB
    for (const so of shopifyOrders) {
      const orderNum = so.name?.replace("#", "");
      if (!localOrders.find((lo) => lo.orderNumber === orderNum)) {
        results.push({
          orderNumber: orderNum || so.id.toString(),
          status: this.mapShopifyStatus(
            so.fulfillment_status,
            so.financial_status,
          ),
          financialStatus: so.financial_status || "unknown",
          fulfillmentStatus: so.fulfillment_status || "unfulfilled",
          total: parseFloat(so.total_price) || 0,
          currency: so.currency || "USD",
          items: this.formatLineItems(null, so.line_items),
          orderDate: so.created_at,
          tracking: this.extractTracking(so),
          customerName: so.customer
            ? `${so.customer.first_name || ""} ${so.customer.last_name || ""}`.trim()
            : null,
        });
      }
    }

    return results;
  }

  /**
   * Extract tracking information from Shopify order/fulfillments
   */
  private static extractTracking(shopifyOrder: any): TrackingInfo | null {
    if (!shopifyOrder) return null;

    const fulfillments =
      shopifyOrder.fulfillments || shopifyOrder.fulfillment || [];
    if (!Array.isArray(fulfillments) || fulfillments.length === 0) return null;

    const latest = fulfillments[fulfillments.length - 1];
    return {
      trackingNumber: latest.tracking_number || null,
      trackingUrl: latest.tracking_url || null,
      trackingCompany: latest.tracking_company || null,
      shippedAt: latest.created_at || null,
      estimatedDelivery: latest.estimated_delivery_at || null,
      status: latest.shipment_status || latest.status || "in_transit",
    };
  }

  /**
   * Format line items from local or Shopify data
   */
  private static formatLineItems(
    localItems: any,
    shopifyItems: any[],
  ): LineItem[] {
    if (shopifyItems && Array.isArray(shopifyItems)) {
      return shopifyItems.map((item) => ({
        name: item.title || item.name || "Unknown Item",
        quantity: item.quantity || 1,
        price: parseFloat(item.price) || 0,
        sku: item.sku || null,
        variantTitle: item.variant_title || null,
      }));
    }

    if (localItems && Array.isArray(localItems)) {
      return localItems.map((item: any) => ({
        name: item.title || item.name || "Unknown Item",
        quantity: item.quantity || 1,
        price: parseFloat(item.price) || 0,
        sku: item.sku || null,
        variantTitle: item.variant_title || item.variantTitle || null,
      }));
    }

    return [];
  }

  /**
   * Map Shopify statuses to our OrderStatus enum
   */
  private static mapShopifyStatus(
    fulfillmentStatus: string | null,
    financialStatus: string | null,
  ): string {
    if (financialStatus === "refunded") return "CANCELLED";
    if (fulfillmentStatus === "fulfilled") return "FULFILLED";
    if (financialStatus === "paid") return "PAID";
    return "PENDING";
  }

  /**
   * Create a return request (stored locally, notification sent)
   */
  static async createReturnRequest(params: {
    customerId: string;
    organizationId: string;
    orderNumber: string;
    reason: string;
    items?: string[];
  }) {
    const { customerId, organizationId, orderNumber, reason, items } = params;

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.replace(/^#/, ""),
        customerId,
        organizationId,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Check if order is eligible for return (within 30 days, fulfilled, not already returned)
    const orderDate = order.orderDate || order.createdAt;
    const daysSinceOrder = Math.floor(
      (Date.now() - new Date(orderDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceOrder > RETURN_WINDOW_DAYS) {
      return {
        success: false,
        error: `This order was placed ${daysSinceOrder} days ago. Our return policy allows returns within ${RETURN_WINDOW_DAYS} days of purchase.`,
      };
    }

    if (order.status === "CANCELLED") {
      return {
        success: false,
        error: "This order has already been cancelled.",
      };
    }

    // Generate return authorization number
    const raNumber = `RA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Check if return already exists
    const existingReturn = await prisma.returnRequest.findFirst({
      where: {
        orderId: order.id,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (existingReturn) {
      return {
        success: false,
        error: `A return request (${existingReturn.raNumber}) already exists for this order. Status: ${existingReturn.status}`,
      };
    }

    // Create return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        customerId,
        organizationId,
        raNumber,
        reason,
        items: items || [],
        status: "PENDING",
        orderTotal: order.total,
      },
    });

    // Log customer activity
    await prisma.customerActivity.create({
      data: {
        type: "RETURN_REQUESTED",
        description: `Return request ${raNumber} created for order #${orderNumber}`,
        customerId,
        metadata: {
          returnId: returnRequest.id,
          raNumber,
          orderNumber,
          reason,
        },
      },
    });

    return {
      success: true,
      returnRequest: {
        id: returnRequest.id,
        raNumber,
        orderNumber,
        reason,
        status: "PENDING",
        orderTotal: order.total,
        customerName: order.customer
          ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()
          : null,
      },
    };
  }

  /**
   * Get return request status
   */
  static async getReturnStatus(params: {
    customerId: string;
    raNumber?: string;
    orderNumber?: string;
  }) {
    const { customerId, raNumber, orderNumber } = params;

    const whereClause: any = { customerId };
    if (raNumber) whereClause.raNumber = raNumber;
    if (orderNumber) {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber: orderNumber.replace(/^#/, ""),
          customerId,
        },
      });
      if (order) whereClause.orderId = order.id;
    }

    const returns = await prisma.returnRequest.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return returns.map((r: any) => ({
      raNumber: r.raNumber,
      orderNumber: r.order.orderNumber || "N/A",
      status: r.status,
      reason: r.reason,
      orderTotal: r.order.total,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      refundAmount: r.refundAmount,
    }));
  }

  /**
   * Format a human-readable order summary for the chatbot
   */
  static formatOrderForChat(order: OrderResult): string {
    let summary = `📦 Order #${order.orderNumber}\n`;
    summary += `   Status: ${this.getStatusEmoji(order.status)} ${order.status}\n`;
    summary += `   Payment: ${order.financialStatus}\n`;
    summary += `   Total: $${order.total.toFixed(2)} ${order.currency}\n`;
    summary += `   Date: ${new Date(order.orderDate).toLocaleDateString()}\n`;

    if (order.items.length > 0) {
      summary += `   Items:\n`;
      order.items.forEach((item) => {
        summary += `     • ${item.name}${item.variantTitle ? ` (${item.variantTitle})` : ""} x${item.quantity} — $${item.price.toFixed(2)}\n`;
      });
    }

    if (order.tracking) {
      summary += `\n   📍 Tracking:\n`;
      if (order.tracking.trackingCompany) {
        summary += `     Carrier: ${order.tracking.trackingCompany}\n`;
      }
      if (order.tracking.trackingNumber) {
        summary += `     Number: ${order.tracking.trackingNumber}\n`;
      }
      if (order.tracking.trackingUrl) {
        summary += `     Track: ${order.tracking.trackingUrl}\n`;
      }
      if (order.tracking.shippedAt) {
        summary += `     Shipped: ${new Date(order.tracking.shippedAt).toLocaleDateString()}\n`;
      }
    }

    return summary;
  }

  private static getStatusEmoji(status: string): string {
    const map: Record<string, string> = {
      FULFILLED: "✅",
      PAID: "💳",
      PENDING: "⏳",
      CANCELLED: "❌",
      REFUNDED: "💰",
    };
    return map[status] || "📦";
  }
}

// Types
interface OrderResult {
  orderNumber: string;
  status: string;
  financialStatus: string;
  fulfillmentStatus: string;
  total: number;
  currency: string;
  items: LineItem[];
  orderDate: string | Date;
  tracking: TrackingInfo | null;
  customerName: string | null;
}

interface LineItem {
  name: string;
  quantity: number;
  price: number;
  sku: string | null;
  variantTitle: string | null;
}

interface TrackingInfo {
  trackingNumber: string | null;
  trackingUrl: string | null;
  trackingCompany: string | null;
  shippedAt: string | null;
  estimatedDelivery: string | null;
  status: string;
}
