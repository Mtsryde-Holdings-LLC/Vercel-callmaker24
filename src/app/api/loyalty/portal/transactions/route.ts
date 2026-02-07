import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get customer transaction history
export async function GET(req: NextRequest) {
  try {
    // Get customer from session token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
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

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        summary: {
          totalOrders: orders.length,
          totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
          totalDiscounts: discounts.reduce((sum, d) => sum + d.amount, 0),
        },
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
