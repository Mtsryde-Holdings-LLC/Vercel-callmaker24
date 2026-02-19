import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(
  async (_req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const tiers = await prisma.loyaltyTier.findMany({
      where: { organizationId },
      orderBy: { minPoints: "asc" },
    });

    return apiSuccess(tiers, { requestId });
  },
  { route: "GET /api/loyalty/tiers", rateLimit: RATE_LIMITS.standard },
);

export const POST = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await req.json();

    const tier = await prisma.loyaltyTier.create({
      data: {
        name: body.name,
        tier: body.tier,
        minPoints: body.minPoints,
        pointsPerDollar: body.pointsPerDollar,
        benefits: body.benefits,
        organizationId,
      },
    });

    return apiSuccess(tier, { requestId });
  },
  { route: "POST /api/loyalty/tiers", rateLimit: RATE_LIMITS.standard },
);

export const PATCH = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await req.json();

    const tier = await prisma.loyaltyTier.updateMany({
      where: {
        tier: body.tier,
        organizationId,
      },
      data: {
        name: body.name,
        minPoints: body.minPoints,
        pointsPerDollar: body.pointsPerDollar,
        benefits: body.benefits,
      },
    });

    return apiSuccess(tier, { requestId });
  },
  { route: "PATCH /api/loyalty/tiers", rateLimit: RATE_LIMITS.standard },
);
