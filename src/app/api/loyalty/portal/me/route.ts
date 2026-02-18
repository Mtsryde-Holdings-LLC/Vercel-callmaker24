import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
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
      process.env.NEXTAUTH_SECRET || "fallback-secret",
    ) as any;
    return decoded.customerId;
  } catch {
    return null;
  }
}

// GET customer profile and loyalty data
export const GET = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const customerId = verifyCustomerSession(request);

    if (!customerId) {
      return apiError("Unauthorized", { status: 401, requestId });
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
      return apiError("Customer not found", { status: 404, requestId });
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
      (t) => t.tier === customer.loyaltyTier,
    );
    const nextTier =
      currentTierIndex >= 0 && currentTierIndex < allTiers.length - 1
        ? allTiers[currentTierIndex + 1]
        : null;

    return apiSuccess(
      {
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
      { requestId },
    );
  },
  { route: "GET /api/loyalty/portal/me" },
);
