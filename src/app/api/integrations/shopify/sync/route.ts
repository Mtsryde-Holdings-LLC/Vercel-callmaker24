import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.text();
    if (!body) {
      return NextResponse.json({ error: "No body provided" }, { status: 400 });
    }
    const { organizationId, shop, accessToken } = JSON.parse(body);
    console.log("[SHOPIFY SYNC] Started:", { organizationId, shop });

    // Sync ALL customers with pagination
    let syncedCustomers = 0;
    let customerPageInfo = null;
    let customerPageCount = 0;

    do {
      const url = customerPageInfo
        ? `https://${shop}/admin/api/2024-01/customers.json?limit=250&page_info=${customerPageInfo}`
        : `https://${shop}/admin/api/2024-01/customers.json?limit=250`;

      const customersResponse = await fetch(url, {
        headers: { "X-Shopify-Access-Token": accessToken },
      });

      if (!customersResponse.ok) {
        console.error(
          "[SHOPIFY SYNC] Customers fetch error:",
          customersResponse.status
        );
        break;
      }

      const customersData = await customersResponse.json();
      const { customers } = customersData;

      console.log(
        `[SHOPIFY SYNC] Customers page ${customerPageCount + 1}: ${
          customers?.length || 0
        } customers`
      );

      if (!customers || customers.length === 0) break;

      for (const customer of customers) {
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
              phone: customer.phone,
              totalSpent: parseFloat(customer.total_spent || "0"),
              orderCount: customer.orders_count || 0,
              organizationId,
              createdById: session.user.id,
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
          console.error(
            "[SHOPIFY SYNC] Customer error:",
            customer.email,
            err.message
          );
        }
      }

      // Get next page info from Link header
      const linkHeader = customersResponse.headers.get("Link");
      const nextMatch = linkHeader?.match(
        /<[^>]*[?&]page_info=([^>&]+)[^>]*>; rel="next"/
      );
      customerPageInfo = nextMatch?.[1] || null;

      customerPageCount++;
    } while (customerPageInfo);

    console.log(`[SHOPIFY SYNC] Total customers synced: ${syncedCustomers}`);

    // Sync ALL orders with pagination
    let syncedOrders = 0;
    let orderPageInfo = null;
    let orderPageCount = 0;

    do {
      const url = orderPageInfo
        ? `https://${shop}/admin/api/2024-01/orders.json?limit=250&status=any&page_info=${orderPageInfo}`
        : `https://${shop}/admin/api/2024-01/orders.json?limit=250&status=any`;

      const ordersResponse = await fetch(url, {
        headers: { "X-Shopify-Access-Token": accessToken },
      });

      if (!ordersResponse.ok) {
        console.error(
          "[SHOPIFY SYNC] Orders fetch error:",
          ordersResponse.status
        );
        break;
      }

      const ordersData = await ordersResponse.json();
      const { orders } = ordersData;

      console.log(
        `[SHOPIFY SYNC] Orders page ${orderPageCount + 1}: ${
          orders?.length || 0
        } orders`
      );

      if (!orders || orders.length === 0) break;

      for (const order of orders) {
        try {
          // Find customer by email or shopify ID
          let customer = null;
          if (order.customer?.email) {
            customer = await prisma.customer.findFirst({
              where: {
                email: order.customer.email,
                organizationId,
              },
            });
          }

          if (!customer && order.customer?.id) {
            customer = await prisma.customer.findFirst({
              where: {
                shopifyId: order.customer.id.toString(),
                organizationId,
              },
            });
          }

          // Create customer if not found
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
                organizationId,
                createdById: session.user.id,
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
                  ? "DELIVERED"
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
                organizationId,
              },
              update: {
                orderNumber: order.name || order.order_number?.toString(),
                status: order.cancelled_at
                  ? "CANCELLED"
                  : order.fulfillment_status === "fulfilled"
                  ? "DELIVERED"
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
          console.error("[SHOPIFY SYNC] Order error:", order.name, err.message);
        }
      }

      // Get next page info from Link header
      const linkHeader = ordersResponse.headers.get("Link");
      const nextMatch = linkHeader?.match(
        /<[^>]*[?&]page_info=([^>&]+)[^>]*>; rel="next"/
      );
      orderPageInfo = nextMatch?.[1] || null;

      orderPageCount++;
    } while (orderPageInfo);

    console.log(`[SHOPIFY SYNC] Total orders synced: ${syncedOrders}`);

    return NextResponse.json({
      success: true,
      synced: {
        customers: syncedCustomers,
        orders: syncedOrders,
        products: 0,
      },
    });
  } catch (error: any) {
    console.error("[SHOPIFY SYNC] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
