import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { TierPromotionService } from "@/services/tier-promotion.service";

export const POST = withApiHandler(
  async (
    req: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const body = await req.text();
    if (!body) {
      return apiError("No body provided", { status: 400, requestId });
    }
    const { shop, accessToken } = JSON.parse(body);

    if (!shop || !accessToken) {
      return apiError("Missing required fields", {
        status: 400,
        requestId,
        meta: {
          shop: !shop ? "missing" : "present",
          accessToken: !accessToken ? "missing" : "present",
        },
      });
    }

    logger.info("Sync started", {
      route: "POST /api/integrations/shopify/sync",
      organizationId,
      shop,
    });

    // Sync customers with limited pagination to avoid timeout (max 2 pages = 500 customers per sync)
    let syncedCustomers = 0;
    let customerPageInfo = null;
    let customerPageCount = 0;
    const maxCustomerPages = 2;
    const syncedCustomerIds: string[] = [];

    do {
      const url: string = customerPageInfo
        ? `https://${shop}/admin/api/2025-01/customers.json?limit=250&page_info=${customerPageInfo}`
        : `https://${shop}/admin/api/2025-01/customers.json?limit=250`;

      const customersResponse: Response = await fetch(url, {
        headers: { "X-Shopify-Access-Token": accessToken },
      });

      if (!customersResponse.ok) {
        const errorText = await customersResponse.text();

        if (customerPageCount === 0) {
          return apiError("Failed to fetch customers from Shopify", {
            status: customersResponse.status,
            requestId,
            meta: {
              shopifyError: errorText,
              hint:
                customersResponse.status === 401
                  ? "Invalid access token. Please reconnect your Shopify store."
                  : customersResponse.status === 404
                    ? "Store not found. Check your shop URL."
                    : "Shopify API error. Check your credentials.",
            },
          });
        }
        break;
      }

      const customersData = await customersResponse.json();
      const { customers } = customersData;

      logger.info(
        `Customers page ${customerPageCount + 1}: ${customers?.length || 0} customers`,
        { route: "POST /api/integrations/shopify/sync", organizationId },
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
          syncedCustomerIds.push(customer.id.toString());
          syncedCustomers++;
        } catch (err: any) {
          logger.warn("Failed to upsert customer", {
            route: "POST /api/integrations/shopify/sync",
            shopifyCustomerId: customer.id,
            error: err.message,
          });
        }
      }

      // Get next page info from Link header
      const linkHeader: string | null = customersResponse.headers.get("Link");
      const nextMatch: RegExpMatchArray | null =
        linkHeader?.match(/<[^>]*[?&]page_info=([^>&]+)[^>]*>; rel="next"/) ||
        null;
      customerPageInfo = nextMatch?.[1] || null;

      customerPageCount++;

      // Stop after max pages to avoid timeout
      if (customerPageCount >= maxCustomerPages) {
        logger.info(
          `Reached max customer pages (${maxCustomerPages}), stopping`,
          { route: "POST /api/integrations/shopify/sync", organizationId },
        );
        break;
      }
    } while (customerPageInfo);

    logger.info(`Total customers synced: ${syncedCustomers}`, {
      route: "POST /api/integrations/shopify/sync",
      organizationId,
      syncedCustomers,
    });

    // Sync orders with limited pagination (max 2 pages = 500 orders per sync)
    let syncedOrders = 0;
    let orderPageInfo = null;
    let orderPageCount = 0;
    const maxOrderPages = 2; // 500 orders max per sync to avoid timeout
    const syncedOrderCustomerIds: string[] = [];

    logger.info("Starting orders sync", {
      route: "POST /api/integrations/shopify/sync",
      organizationId,
    });

    do {
      const url: string = orderPageInfo
        ? `https://${shop}/admin/api/2025-01/orders.json?limit=250&status=any&page_info=${orderPageInfo}`
        : `https://${shop}/admin/api/2025-01/orders.json?limit=250&status=any`;

      logger.debug("Fetching orders", {
        route: "POST /api/integrations/shopify/sync",
        url,
      });

      const ordersResponse: Response = await fetch(url, {
        headers: { "X-Shopify-Access-Token": accessToken },
      });

      logger.debug("Orders response status", {
        route: "POST /api/integrations/shopify/sync",
        status: ordersResponse.status,
      });

      if (!ordersResponse.ok) {
        const errorText = await ordersResponse.text();
        break;
      }

      const ordersData = await ordersResponse.json();
      const { orders } = ordersData;

      logger.info(
        `Orders page ${orderPageCount + 1}: ${orders?.length || 0} orders`,
        { route: "POST /api/integrations/shopify/sync", organizationId },
      );

      if (!orders || orders.length === 0) break;

      for (const order of orders) {
        try {
          logger.debug("Processing order", {
            route: "POST /api/integrations/shopify/sync",
            orderName: order.name,
            customerEmail: order.customer?.email,
            shopifyCustomerId: order.customer?.id,
          });

          // Find customer by shopify ID first (most reliable), then email
          let customer = null;
          if (order.customer?.id) {
            customer = await prisma.customer.findFirst({
              where: {
                shopifyId: order.customer.id.toString(),
                organizationId,
              },
            });
            logger.debug("Customer lookup by Shopify ID", {
              route: "POST /api/integrations/shopify/sync",
              shopifyId: order.customer.id,
              found: !!customer,
            });
          }

          if (!customer && order.customer?.email) {
            customer = await prisma.customer.findFirst({
              where: {
                email: { equals: order.customer.email, mode: "insensitive" },
                organizationId,
              },
            });
            logger.debug("Customer lookup by email", {
              route: "POST /api/integrations/shopify/sync",
              email: order.customer.email,
              found: !!customer,
            });
          }

          logger.debug("Customer found", {
            route: "POST /api/integrations/shopify/sync",
            found: !!customer,
          });

          // Create customer if not found
          if (!customer && order.customer) {
            logger.info("Creating new customer for order", {
              route: "POST /api/integrations/shopify/sync",
              organizationId,
            });
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
            logger.debug("Creating/updating order", {
              route: "POST /api/integrations/shopify/sync",
              orderName: order.name,
            });
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
                  order.total_shipping_price_set?.shop_money?.amount || "0",
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
                    ? "FULFILLED"
                    : "PENDING",
                financialStatus: order.financial_status,
                fulfillmentStatus: order.fulfillment_status,
                subtotal: parseFloat(order.subtotal_price || "0"),
                tax: parseFloat(order.total_tax || "0"),
                shipping: parseFloat(
                  order.total_shipping_price_set?.shop_money?.amount || "0",
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
            logger.info("Order synced successfully", {
              route: "POST /api/integrations/shopify/sync",
              orderName: order.name,
            });
            if (customer.id) syncedOrderCustomerIds.push(customer.id);
          } else {
            logger.warn("Skipping order - no customer", {
              route: "POST /api/integrations/shopify/sync",
              orderName: order.name,
            });
          }
        } catch (err: any) {
          logger.warn("Failed to upsert order", {
            route: "POST /api/integrations/shopify/sync",
            orderName: order.name,
            error: err.message,
          });
        }
      }

      // Get next page info from Link header
      const linkHeader: string | null = ordersResponse.headers.get("Link");
      const nextMatch: RegExpMatchArray | null =
        linkHeader?.match(/<[^>]*[?&]page_info=([^>&]+)[^>]*>; rel="next"/) ||
        null;
      orderPageInfo = nextMatch?.[1] || null;

      orderPageCount++;

      // Stop after max pages to avoid timeout
      if (orderPageCount >= maxOrderPages) {
        logger.info(`Reached max order pages (${maxOrderPages}), stopping`, {
          route: "POST /api/integrations/shopify/sync",
          organizationId,
        });
        break;
      }
    } while (orderPageInfo);

    logger.info(`Total orders synced: ${syncedOrders}`, {
      route: "POST /api/integrations/shopify/sync",
      organizationId,
      syncedOrders,
    });

    // Update customer totalSpent and orderCount ONLY for customers synced in this batch
    // (avoids loading ALL customers which causes timeouts on Vercel)
    logger.info("Updating customer order statistics for synced batch", {
      route: "POST /api/integrations/shopify/sync",
      organizationId,
    });
    let loyaltyPointsAwarded = 0;
    try {
      // Collect unique customer IDs that were touched in this sync
      const touchedCustomerIds = [...new Set([...syncedCustomerIds, ...syncedOrderCustomerIds])];

      if (touchedCustomerIds.length > 0) {
        const customersWithOrders = await prisma.customer.findMany({
          where: {
            organizationId,
            OR: [
              { shopifyId: { in: syncedCustomerIds.length > 0 ? syncedCustomerIds : ['__none__'] } },
              { id: { in: syncedOrderCustomerIds.length > 0 ? syncedOrderCustomerIds : ['__none__'] } },
            ],
          },
          include: {
            orders: {
              select: {
                total: true,
                totalAmount: true,
                status: true,
                financialStatus: true,
              },
            },
          },
        });

      for (const customer of customersWithOrders) {
        const orderCount = customer.orders.length;
        const totalSpent = customer.orders.reduce(
          (sum, order) => sum + (order.total || 0),
          0,
        );

        // Calculate loyalty points from paid/fulfilled orders (1 point per $1)
        let loyaltyUpdate: any = {};
        if (customer.loyaltyMember) {
          const paidOrders = customer.orders.filter(
            (o) =>
              (o.financialStatus === "paid" ||
                o.status === "FULFILLED" ||
                o.status === "PAID") &&
              o.financialStatus !== "refunded" &&
              o.financialStatus !== "partially_refunded",
          );
          const earnedPoints = paidOrders.reduce(
            (sum, o) => sum + Math.floor(o.totalAmount || o.total || 0),
            0,
          );

          // Only update if calculated points are higher than current
          // (to avoid reducing points if customer has manually earned extra)
          if (earnedPoints > customer.loyaltyPoints) {
            loyaltyUpdate.loyaltyPoints = earnedPoints;
            loyaltyPointsAwarded++;
            logger.info(`Awarding ${earnedPoints} loyalty points`, {
              route: "POST /api/integrations/shopify/sync",
              customerId: customer.id,
              customerName: `${customer.firstName} ${customer.lastName}`,
              earnedPoints,
            });
          }
        }

        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            orderCount,
            totalSpent,
            ...loyaltyUpdate,
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
      logger.info(
        `Updated order statistics for ${customersWithOrders.length} customers`,
        {
          route: "POST /api/integrations/shopify/sync",
          organizationId,
          customersUpdated: customersWithOrders.length,
          loyaltyPointsAwarded,
        },
      );
      }
    } catch (err: any) {
      logger.warn("Failed to update customer statistics", {
        route: "POST /api/integrations/shopify/sync",
        error: err.message,
      });
      // Continue even if statistics update fails
    }

    // Auto-promote loyalty tiers for synced customers based on their points
    let tiersPromoted = 0;
    try {
      const loyaltyCustomers = await prisma.customer.findMany({
        where: {
          organizationId,
          loyaltyMember: true,
          OR: [
            { shopifyId: { in: syncedCustomerIds.length > 0 ? syncedCustomerIds : ['__none__'] } },
            { id: { in: syncedOrderCustomerIds.length > 0 ? syncedOrderCustomerIds : ['__none__'] } },
          ],
        },
        select: { id: true, loyaltyPoints: true },
      });

      for (const customer of loyaltyCustomers) {
        try {
          const result = await TierPromotionService.checkAndPromote({
            customerId: customer.id,
            currentPoints: customer.loyaltyPoints,
            organizationId,
          });
          if (result.promoted) {
            tiersPromoted++;
            logger.info(`Tier promoted: ${result.previousTier} -> ${result.newTier}`, {
              route: "POST /api/integrations/shopify/sync",
              customerId: customer.id,
            });
          }
        } catch (err: any) {
          logger.warn("Tier promotion failed for customer", {
            route: "POST /api/integrations/shopify/sync",
            customerId: customer.id,
            error: err.message,
          });
        }
      }
      if (tiersPromoted > 0) {
        logger.info(`Promoted ${tiersPromoted} customers to higher tiers`, {
          route: "POST /api/integrations/shopify/sync",
          organizationId,
        });
      }
    } catch (err: any) {
      logger.warn("Failed to run tier promotions", {
        route: "POST /api/integrations/shopify/sync",
        error: err.message,
      });
    }

    return apiSuccess(
      {
        success: true,
        synced: {
          customers: syncedCustomers,
          orders: syncedOrders,
          products: 0,
          tiersPromoted,
        },
        message:
          customerPageCount >= maxCustomerPages ||
          orderPageCount >= maxOrderPages
            ? `Synced ${syncedCustomers} customers and ${syncedOrders} orders. Click sync again to continue syncing more data.`
            : `All data synced successfully!`,
      },
      { requestId },
    );
  },
  {
    route: "POST /api/integrations/shopify/sync",
    rateLimit: RATE_LIMITS.standard,
  },
);
