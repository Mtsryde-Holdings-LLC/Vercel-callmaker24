import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// Get customer transaction history
export const GET = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    // Get customer from session token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return apiError("Unauthorized", { status: 401, requestId });
    }

    const sessionToken = authHeader.substring(7);

    // Verify token - check if it's a portal token
    const customer = await prisma.customer.findFirst({
      where: {
        portalToken: sessionToken,
        portalTokenExpiry: { gte: new Date() },
      },
      include: {
        organization: true,
      },
    });

    if (!customer) {
      return apiError("Invalid session", { status: 401, requestId });
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: {
        customerId: customer.id,
        organizationId: customer.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        financialStatus: true,
        subtotal: true,
        tax: true,
        shipping: true,
        discount: true,
        total: true,
        items: true,
        source: true,
        orderDate: true,
        createdAt: true,
      },
    });

    // Fetch discount usage
    const discounts = await prisma.discountUsage.findMany({
      where: {
        customerId: customer.id,
        organizationId: customer.organizationId,
      },
      orderBy: {
        usedAt: "desc",
      },
      select: {
        id: true,
        code: true,
        amount: true,
        type: true,
        orderId: true,
        usedAt: true,
      },
    });

    // Combine and format transactions
    const transactions = [
      ...orders.map((order) => ({
        id: order.id,
        type: "order" as const,
        orderNumber: order.orderNumber,
        status: order.status,
        financialStatus: order.financialStatus,
        amount: order.total,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        items: order.items,
        source: order.source,
        date: order.orderDate || order.createdAt,
        createdAt: order.createdAt,
      })),
      ...discounts.map((discount) => ({
        id: discount.id,
        type: "discount" as const,
        code: discount.code,
        amount: discount.amount,
        discountType: discount.type,
        orderId: discount.orderId,
        date: discount.usedAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return apiSuccess(
      {
        transactions,
        summary: {
          totalOrders: orders.length,
          totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
          totalDiscounts: discounts.reduce((sum, d) => sum + d.amount, 0),
        },
      },
      { requestId },
    );
  },
  { route: "GET /api/loyalty/portal/transactions" },
);
