import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(
  async (
    request: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!customer) {
      return apiError("Customer not found", { status: 404, requestId });
    }

    const discounts = await prisma.discountUsage.findMany({
      where: { customerId: params.id, organizationId },
      orderBy: { usedAt: "desc" },
    });

    return apiSuccess(discounts, { requestId });
  },
  {
    route: "GET /api/customers/[id]/discounts",
    rateLimit: RATE_LIMITS.standard,
  },
);
