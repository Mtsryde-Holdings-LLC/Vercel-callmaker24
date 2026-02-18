import { NextRequest } from "next/server";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export const GET = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get("plan");
    const billing = searchParams.get("billing");

    if (!plan || !billing) {
      return apiError("Plan and billing period are required", {
        status: 400,
        requestId,
      });
    }

    // Build the environment variable key
    const envKey =
      billing === "monthly"
        ? `STRIPE_PRICE_ID_${plan}_MONTHLY`
        : `STRIPE_PRICE_ID_${plan}_ANNUAL`;

    const priceId = process.env[envKey];

    if (!priceId) {
      return apiError(`Price ID not found for ${plan} ${billing}`, {
        status: 404,
        requestId,
      });
    }

    return apiSuccess({ priceId }, { requestId });
  },
  { route: "GET /api/get-price-id" },
);
