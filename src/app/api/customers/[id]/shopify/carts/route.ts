import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
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

    if (!customer?.shopifyId) {
      return apiSuccess([], { requestId });
    }

    const integration = await prisma.integration.findFirst({
      where: { organizationId, platform: "shopify" },
    });

    if (!integration) {
      return apiSuccess([], { requestId });
    }

    const { shop, accessToken } = integration.credentials as any;

    const response = await fetch(
      `https://${shop}/admin/api/2024-01/checkouts.json?customer_id=${customer.shopifyId}&status=open`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return apiSuccess([], { requestId });
    }

    const data = await response.json();

    const carts = data.checkouts.map((checkout: any) => ({
      id: checkout.id,
      total: parseFloat(checkout.total_price),
      items: checkout.line_items,
      createdAt: checkout.created_at,
      recovered: false,
    }));

    return apiSuccess(carts, { requestId });
  },
  {
    route: "GET /api/customers/[id]/shopify/carts",
    rateLimit: RATE_LIMITS.standard,
  },
);
