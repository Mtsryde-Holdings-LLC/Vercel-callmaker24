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

    const orders = await prisma.order.findMany({
      where: { customerId: params.id, organizationId },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(orders, { requestId });
  },
  {
    route: "GET /api/customers/[id]/orders",
    rateLimit: RATE_LIMITS.standard,
  },
);
