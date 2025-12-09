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

    // Validate required fields
    if (!organizationId || !shop || !accessToken) {
      console.error("[SHOPIFY SYNC] Missing required fields:", {
        hasOrgId: !!organizationId,
        hasShop: !!shop,
        hasToken: !!accessToken,
      });
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            organizationId: !organizationId ? "missing" : "present",
            shop: !shop ? "missing" : "present",
            accessToken: !accessToken ? "missing" : "present",
          },
        },
        { status: 400 }
      );
    }

    console.log("[SHOPIFY SYNC] Started:", { organizationId, shop });

    // Sync customers with limited pagination to avoid timeout (max 2 pages = 500 customers per sync)
    let syncedCustomers = 0;
    let customerPageInfo = null;
    let customerPageCount = 0;
    const maxCustomerPages = 2; // 500 customers max per sync to avoid timeout

    do {
      const url = customerPageInfo
        ? `https://${shop}/admin/api/2024-01/customers.json?limit=250&page_info=${customerPageInfo}`
        : `https://${shop}/admin/api/2024-01/customers.json?limit=250`;

      const customersResponse = await fetch(url, {
        headers: { "X-Shopify-Access-Token": accessToken },
      });

      if (!customersResponse.ok) {
        const errorText = await customersResponse.text();
        console.error(
          "[SHOPIFY SYNC] Customers fetch error:",
          customersResponse.status,
          errorText
        );

        // Return detailed error for first page failure
        if (customerPageCount === 0) {
          return NextResponse.json(
            {
              error: "Failed to fetch customers from Shopify",
              shopifyError: errorText,
              statusCode: customersResponse.status,
              hint:
                customersResponse.status === 401
                  ? "Invalid access token. Please reconnect your Shopify store."
                  : customersResponse.status === 404
                  ? "Store not found. Check your shop URL."
                  : "Shopify API error. Check your credentials.",
            },
            { status: customersResponse.status }
          );
        }
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

      // Stop after max pages to avoid timeout
      if (customerPageCount >= maxCustomerPages) {
        console.log(
          `[SHOPIFY SYNC] Reached max customer pages (${maxCustomerPages}), stopping`
        );
        break;
      }
    } while (customerPageInfo);

    console.log(`[SHOPIFY SYNC] Total customers synced: ${syncedCustomers}`);

    // Sync orders with limited pagination (max 2 pages = 500 orders per sync)
    let syncedOrders = 0;
    let orderPageInfo = null;
    let orderPageCount = 0;
    const maxOrderPages = 2; // 500 orders max per sync to avoid timeout

    console.log("[SHOPIFY SYNC] Starting orders sync...");

    do {
      const url = orderPageInfo
        ? `https://${shop}/admin/api/2024-01/orders.json?limit=250&status=any&page_info=${orderPageInfo}`
        : `https://${shop}/admin/api/2024-01/orders.json?limit=250&status=any`;

      console.log("[SHOPIFY SYNC] Fetching orders from:", url);

      const ordersResponse = await fetch(url, {
        headers: { "X-Shopify-Access-Token": accessToken },
      });

      console.log(
        "[SHOPIFY SYNC] Orders response status:",
        ordersResponse.status
      );

      if (!ordersResponse.ok) {
        const errorText = await ordersResponse.text();
        console.error(
          "[SHOPIFY SYNC] Orders fetch error:",
          ordersResponse.status,
          errorText
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
          console.log(
            "[SHOPIFY SYNC] Processing order:",
            order.name,
            "for customer:",
            order.customer?.email
          );

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

          console.log("[SHOPIFY SYNC] Customer found:", !!customer);

          // Create customer if not found
          if (!customer && order.customer) {
            console.log("[SHOPIFY SYNC] Creating new customer for order");
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
            console.log("[SHOPIFY SYNC] Creating/updating order:", order.name);
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
            console.log(
              "[SHOPIFY SYNC] Order synced successfully:",
              order.name
            );
          } else {
            console.log(
              "[SHOPIFY SYNC] Skipping order - no customer:",
              order.name
            );
          }
        } catch (err: any) {
          console.error(
            "[SHOPIFY SYNC] Order error:",
            order.name,
            err.message,
            err.stack
          );
        }
      }

      // Get next page info from Link header
      const linkHeader = ordersResponse.headers.get("Link");
      const nextMatch = linkHeader?.match(
        /<[^>]*[?&]page_info=([^>&]+)[^>]*>; rel="next"/
      );
      orderPageInfo = nextMatch?.[1] || null;

      orderPageCount++;

      // Stop after max pages to avoid timeout
      if (orderPageCount >= maxOrderPages) {
        console.log(
          `[SHOPIFY SYNC] Reached max order pages (${maxOrderPages}), stopping`
        );
        break;
      }
    } while (orderPageInfo);

    console.log(`[SHOPIFY SYNC] Total orders synced: ${syncedOrders}`);

    // Update customer totalSpent and orderCount based on synced orders
    console.log("[SHOPIFY SYNC] Updating customer order statistics...");
    try {
      const customersWithOrders = await prisma.customer.findMany({
        where: { organizationId },
        include: {
          orders: {
            select: {
              total: true,
            },
          },
        },
      });

      for (const customer of customersWithOrders) {
        const orderCount = customer.orders.length;
        const totalSpent = customer.orders.reduce(
          (sum, order) => sum + (order.total || 0),
          0
        );

        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            orderCount,
            totalSpent,
            lastOrderAt:
              orderCount > 0
                ? await prisma.order
                    .findFirst({
                      where: { customerId: customer.id },
                      orderBy: { orderDate: "desc" },
                      select: { orderDate: true },
                    })
                    .then((order) => order?.orderDate)
                : undefined,
          },
        });
      }
      console.log(
        `[SHOPIFY SYNC] Updated order statistics for ${customersWithOrders.length} customers`
      );
    } catch (err: any) {
      console.error("[SHOPIFY SYNC] Error updating customer statistics:", err);
    }

    return NextResponse.json({
      success: true,
      synced: {
        customers: syncedCustomers,
        orders: syncedOrders,
        products: 0,
      },
      message:
        customerPageCount >= maxCustomerPages || orderPageCount >= maxOrderPages
          ? `Synced ${syncedCustomers} customers and ${syncedOrders} orders. Click sync again to continue syncing more data.`
          : `All data synced successfully!`,
    });
  } catch (error: any) {
    console.error("[SHOPIFY SYNC] Error:", error);
    console.error("[SHOPIFY SYNC] Error stack:", error.stack);
    return NextResponse.json(
      {
        error: error.message,
        details: error.stack,
        type: error.constructor.name,
      },
      { status: 500 }
    );
  }
}
