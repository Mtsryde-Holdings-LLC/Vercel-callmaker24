import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic"; // Don't pre-render this route

export async function GET(req: NextRequest) {
  try {
    console.log("[SHOPIFY CRON] Starting background sync...");

    // Get all organizations with Shopify integrations
    const integrations = await prisma.integration.findMany({
      where: {
        platform: "SHOPIFY",
        isActive: true,
      },
      select: {
        id: true,
        organizationId: true,
        credentials: true,
      },
    });

    console.log(
      `[SHOPIFY CRON] Found ${integrations.length} active Shopify integrations`
    );

    for (const integration of integrations) {
      try {
        const { shop, accessToken } = integration.credentials as any;
        if (!shop || !accessToken) continue;

        console.log(
          `[SHOPIFY CRON] Syncing org ${integration.organizationId}...`
        );

        // Get a user from this org to use as createdBy
        const user = await prisma.user.findFirst({
          where: { organizationId: integration.organizationId },
        });

        if (!user) {
          console.log(
            `[SHOPIFY CRON] No user found for org ${integration.organizationId}`
          );
          continue;
        }

        // Sync customers (1000 at a time)
        let syncedCustomers = 0;
        let customerPageInfo = null;
        let customerPageCount = 0;
        const maxCustomerPages = 4; // 1000 customers per cron run

        do {
          const url = customerPageInfo
            ? `https://${shop}/admin/api/2024-01/customers.json?limit=250&page_info=${customerPageInfo}`
            : `https://${shop}/admin/api/2024-01/customers.json?limit=250`;

          const customersResponse = await fetch(url, {
            headers: { "X-Shopify-Access-Token": accessToken },
          });

          if (!customersResponse.ok) break;

          const customersData = await customersResponse.json();
          const { customers } = customersData;

          if (!customers || customers.length === 0) break;

          for (const customer of customers) {
            try {
              await prisma.customer.upsert({
                where: {
                  shopifyId_organizationId: {
                    shopifyId: customer.id.toString(),
                    organizationId: integration.organizationId,
                  },
                },
                create: {
                  shopifyId: customer.id.toString(),
                  externalId: customer.id.toString(),
                  source: "SHOPIFY",
                  email: customer.email || null,
                  firstName: customer.first_name || "Unknown",
                  lastName: customer.last_name || "",
                  phone: customer.phone,
                  totalSpent: parseFloat(customer.total_spent || "0"),
                  orderCount: customer.orders_count || 0,
                  organizationId: integration.organizationId,
                  createdById: user.id,
                },
                update: {
                  externalId: customer.id.toString(),
                  source: "SHOPIFY",
                  email: customer.email || null,
                  firstName: customer.first_name || "Unknown",
                  lastName: customer.last_name || "",
                  phone: customer.phone,
                  totalSpent: parseFloat(customer.total_spent || "0"),
                  orderCount: customer.orders_count || 0,
                },
              });
              syncedCustomers++;
            } catch (err: any) {
              console.error("[SHOPIFY CRON] Customer error:", err.message);
            }
          }

          const linkHeader = customersResponse.headers.get("Link");
          const nextMatch = linkHeader?.match(
            /<[^>]*[?&]page_info=([^>&]+)[^>]*>; rel="next"/
          );
          customerPageInfo = nextMatch?.[1] || null;

          customerPageCount++;
          if (customerPageCount >= maxCustomerPages) break;
        } while (customerPageInfo);

        console.log(
          `[SHOPIFY CRON] Org ${integration.organizationId}: synced ${syncedCustomers} customers`
        );

        // Sync orders (1000 at a time)
        let syncedOrders = 0;
        let orderPageInfo = null;
        let orderPageCount = 0;
        const maxOrderPages = 4; // 1000 orders per cron run

        do {
          const url = orderPageInfo
            ? `https://${shop}/admin/api/2024-01/orders.json?limit=250&status=any&page_info=${orderPageInfo}`
            : `https://${shop}/admin/api/2024-01/orders.json?limit=250&status=any`;

          const ordersResponse = await fetch(url, {
            headers: { "X-Shopify-Access-Token": accessToken },
          });

          if (!ordersResponse.ok) break;

          const ordersData = await ordersResponse.json();
          const { orders } = ordersData;

          if (!orders || orders.length === 0) break;

          for (const order of orders) {
            try {
              let customer = null;

              if (order.customer?.email) {
                customer = await prisma.customer.findFirst({
                  where: {
                    email: order.customer.email,
                    organizationId: integration.organizationId,
                  },
                });
              }

              if (!customer && order.customer?.id) {
                customer = await prisma.customer.findFirst({
                  where: {
                    shopifyId: order.customer.id.toString(),
                    organizationId: integration.organizationId,
                  },
                });
              }

              if (!customer && order.customer) {
                customer = await prisma.customer.create({
                  data: {
                    shopifyId: order.customer.id?.toString(),
                    externalId: order.customer.id?.toString(),
                    source: "SHOPIFY",
                    email: order.customer.email || null,
                    firstName: order.customer.first_name || "Unknown",
                    lastName: order.customer.last_name || "",
                    phone: order.customer.phone,
                    organizationId: integration.organizationId,
                    createdById: user.id,
                  },
                });
              }

              if (customer) {
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
                      order.total_shipping_price_set?.shop_money?.amount || "0"
                    ),
                    discount: parseFloat(order.total_discounts || "0"),
                    total: parseFloat(order.total_price || "0"),
                    totalAmount: parseFloat(order.total_price || "0"),
                    items: order.line_items,
                    orderDate: order.created_at
                      ? new Date(order.created_at)
                      : new Date(),
                    organizationId: integration.organizationId,
                  },
                  update: {
                    orderNumber: order.name || order.order_number?.toString(),
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
                      order.total_shipping_price_set?.shop_money?.amount || "0"
                    ),
                    discount: parseFloat(order.total_discounts || "0"),
                    total: parseFloat(order.total_price || "0"),
                    totalAmount: parseFloat(order.total_price || "0"),
                    items: order.line_items,
                    orderDate: order.created_at
                      ? new Date(order.created_at)
                      : new Date(),
                  },
                });
                syncedOrders++;
              }
            } catch (err: any) {
              console.error("[SHOPIFY CRON] Order error:", err.message);
            }
          }

          const linkHeader = ordersResponse.headers.get("Link");
          const nextMatch = linkHeader?.match(
            /<[^>]*[?&]page_info=([^>&]+)[^>]*>; rel="next"/
          );
          orderPageInfo = nextMatch?.[1] || null;

          orderPageCount++;
          if (orderPageCount >= maxOrderPages) break;
        } while (orderPageInfo);

        console.log(
          `[SHOPIFY CRON] Org ${integration.organizationId}: synced ${syncedOrders} orders`
        );
      } catch (err: any) {
        console.error(
          `[SHOPIFY CRON] Error syncing org ${integration.organizationId}:`,
          err.message
        );
      }
    }

    console.log("[SHOPIFY CRON] Background sync completed");
    return NextResponse.json({ success: true, message: "Sync completed" });
  } catch (error: any) {
    console.error("[SHOPIFY CRON] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
