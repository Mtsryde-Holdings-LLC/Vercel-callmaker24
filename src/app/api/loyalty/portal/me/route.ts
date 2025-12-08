import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";


export const dynamic = 'force-dynamic'
// Middleware to verify customer session
function verifyCustomerSession(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || "fallback-secret"
    ) as any;
    return decoded.customerId;
  } catch {
    return null;
  }
}

// GET customer profile and loyalty data
export async function GET(req: NextRequest) {
  try {
    const customerId = verifyCustomerSession(req);

    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get loyalty tier info
    const tier = await prisma.loyaltyTier.findFirst({
      where: {
        tier: customer.loyaltyTier || "BRONZE",
        organizationId: customer.organizationId || "",
      },
    });

    // Get next tier info
    const allTiers = await prisma.loyaltyTier.findMany({
      where: {
        organizationId: customer.organizationId || "",
      },
      orderBy: {
        minPoints: "asc",
      },
    });

    const currentTierIndex = allTiers.findIndex(
      (t) => t.tier === customer.loyaltyTier
    );
    const nextTier =
      currentTierIndex >= 0 && currentTierIndex < allTiers.length - 1
        ? allTiers[currentTierIndex + 1]
        : null;

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          birthday: customer.birthday,
          loyaltyPoints: customer.loyaltyPoints,
          loyaltyUsed: customer.loyaltyUsed,
          loyaltyTier: customer.loyaltyTier,
          totalSpent: customer.totalSpent,
          orderCount: customer.orderCount,
          lastOrderAt: customer.lastOrderAt,
        },
        organization: customer.organization,
        currentTier: tier,
        nextTier,
        pointsToNextTier: nextTier
          ? nextTier.minPoints - customer.loyaltyPoints
          : null,
      },
    });
  } catch (error) {
    console.error("Get customer portal data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
