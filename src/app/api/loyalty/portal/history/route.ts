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

// GET customer activity history
export const GET = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const customerId = verifyCustomerSession(request);

    if (!customerId) {
      return apiError("Unauthorized", { status: 401, requestId });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get customer activities (purchases, points earned, points redeemed)
    const activities = await prisma.customerActivity.findMany({
      where: {
        customerId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.customerActivity.count({
      where: {
        customerId,
      },
    });

    return apiSuccess(
      {
        activities,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { requestId },
    );
  },
  { route: "GET /api/loyalty/portal/history" },
);
