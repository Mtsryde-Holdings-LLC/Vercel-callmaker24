import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

// Verify magic link token and create session
export const POST = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { token } = await request.json();

    if (!token) {
      return apiError("Token required", { status: 400, requestId });
    }

    // Find customer by token
    const customer = await prisma.customer.findFirst({
      where: {
        portalToken: token,
        portalTokenExpiry: {
          gte: new Date(), // Token not expired
        },
      },
      include: {
        organization: true,
      },
    });

    if (!customer) {
      return apiError("Invalid or expired token", { status: 401, requestId });
    }

    // Clear token and update last login
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        portalToken: null,
        portalTokenExpiry: null,
        lastPortalLogin: new Date(),
      },
    });

    // Create JWT session token (valid for 24 hours)
    const sessionToken = jwt.sign(
      {
        customerId: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        organizationId: customer.organizationId,
      },
      process.env.NEXTAUTH_SECRET || "fallback-secret",
      { expiresIn: "24h" },
    );

    return apiSuccess(
      {
        sessionToken,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          loyaltyTier: customer.loyaltyTier,
          loyaltyPoints: customer.loyaltyPoints,
          loyaltyUsed: customer.loyaltyUsed,
          totalSpent: customer.totalSpent,
          orderCount: customer.orderCount,
          organization: {
            name: customer.organization?.name,
            slug: customer.organization?.slug,
          },
        },
      },
      { requestId },
    );
  },
  {
    route: "POST /api/loyalty/portal/auth/verify",
    rateLimit: RATE_LIMITS.auth,
  },
);
