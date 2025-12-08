import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log("Auto-enroll: Session check", {
      hasSession: !!session,
      hasUser: !!session?.user,
      organizationId: session?.user?.organizationId,
    });

    let orgId = session?.user?.organizationId;

    // Fallback: If organizationId is missing from session, lookup user
    if (!orgId && session?.user?.email) {
      console.log("Auto-enroll: Looking up user by email", session.user.email);
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { organizationId: true },
      });
      orgId = user?.organizationId;
      console.log("Auto-enroll: User lookup result", { organizationId: orgId });
    }

    if (!orgId) {
      console.error("Auto-enroll: No organization ID found");
      return NextResponse.json(
        { error: "Unauthorized - No organization" },
        { status: 401 }
      );
    }

    console.log("Auto-enroll: Starting for organization", orgId);

    // Get organization's Shopify integration
    const integration = await prisma.integration.findFirst({
      where: {
        organizationId: orgId,
        platform: "shopify",
        isActive: true,
      },
    });

    console.log("Auto-enroll: Integration check", {
      hasIntegration: !!integration,
    });

    let shopDomain: string | null = null;
    let accessToken: string | null = null;

    if (integration) {
      const credentials = integration.credentials as any;
      shopDomain = credentials.shop;
      accessToken = credentials.accessToken;
      console.log("Auto-enroll: Shopify integration available");
    } else {
      console.log("Auto-enroll: No Shopify integration - will use existing customer data");
    }

    // Get all customers with email or phone
    const customers = await prisma.customer.findMany({
      where: {
        organizationId: orgId,
        OR: [{ email: { not: null } }, { phone: { not: null } }],
      },
    });

    console.log("Auto-enroll: Found customers", { count: customers.length });

    let enrolled = 0;
    let pointsAllocated = 0;

    for (const customer of customers) {
      let totalSpent = customer.totalSpent || 0;
      let orderCount = customer.orderCount || 0;
      let points = 0;

      // Try to fetch Shopify data if customer has shopifyId and integration available
      if (customer.shopifyId && shopDomain && accessToken) {
        try {
          const ordersUrl = `https://${shopDomain}/admin/api/2024-01/customers/${customer.shopifyId}/orders.json`;
          const ordersRes = await fetch(ordersUrl, {
            headers: { "X-Shopify-Access-Token": accessToken },
          });

          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            const orders = ordersData.orders || [];

            totalSpent = orders.reduce(
              (sum: number, order: any) =>
                sum + parseFloat(order.total_price || 0),
              0
            );
            orderCount = orders.length;
          }
        } catch (err) {
          console.error(
            `Failed to fetch orders for customer ${customer.id}:`,
            err
          );
        }
      }

      // Calculate points (1 point per dollar)
      points = Math.floor(totalSpent);

      // Update customer with loyalty status
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          loyaltyMember: true,
          loyaltyTier:
            points >= 5000
              ? "DIAMOND"
              : points >= 3000
              ? "PLATINUM"
              : points >= 1500
              ? "GOLD"
              : points >= 500
              ? "SILVER"
              : "BRONZE",
          loyaltyPoints: points,
          totalSpent,
          orderCount,
        },
      });

      enrolled++;
      pointsAllocated += points;
    }

    console.log("Auto-enroll: Complete", { enrolled, pointsAllocated });

    return NextResponse.json({
      success: true,
      enrolled,
      pointsAllocated,
    });
  } catch (error) {
    console.error("Auto-enroll error:", error);
    console.error("Auto-enroll error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to auto-enroll",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
