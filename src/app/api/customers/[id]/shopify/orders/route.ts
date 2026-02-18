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
      `https://${shop}/admin/api/2024-01/customers/${customer.shopifyId}/orders.json`,
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

    const ordersWithImages = data.orders.map((order: any) => ({
      ...order,
      line_items: order.line_items.map((item: any) => ({
        ...item,
        product_image:
          item.properties?.find((p: any) => p.name === "_image")?.value || null,
      })),
    }));

    return apiSuccess(ordersWithImages, { requestId });
  },
  {
    route: "GET /api/customers/[id]/shopify/orders",
    rateLimit: RATE_LIMITS.standard,
  },
);
