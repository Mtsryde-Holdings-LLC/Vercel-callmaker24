import { NextRequest } from "next/server";
import { withAdminHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { RewardTier } from "@prisma/client";
import { TIER_BENEFITS } from "@/lib/constants";

const defaultTiers: {
  tier: RewardTier;
  name: string;
  minPoints: number;
  pointsPerDollar: number;
  benefits: string[];
}[] = [
  {
    tier: "BRONZE",
    name: "Bronze",
    minPoints: 0,
    pointsPerDollar: 1,
    benefits: TIER_BENEFITS.BRONZE,
  },
  {
    tier: "SILVER",
    name: "Silver",
    minPoints: 150,
    pointsPerDollar: 1.5,
    benefits: TIER_BENEFITS.SILVER,
  },
  {
    tier: "GOLD",
    name: "Gold",
    minPoints: 300,
    pointsPerDollar: 2,
    benefits: TIER_BENEFITS.GOLD,
  },
  {
    tier: "DIAMOND",
    name: "Diamond",
    minPoints: 500,
    pointsPerDollar: 3,
    benefits: TIER_BENEFITS.DIAMOND,
  },
];

export const POST = withAdminHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const existingTiers = await prisma.loyaltyTier.findMany({
      where: { organizationId },
    });

    if (existingTiers.length > 0) {
      return apiError("Tiers already exist for this organization", {
        status: 400,
        requestId,
      });
    }

    const createdTiers = await Promise.all(
      defaultTiers.map((tier) =>
        prisma.loyaltyTier.create({
          data: { ...tier, organizationId },
        }),
      ),
    );

    return apiSuccess(
      {
        message: `Successfully created ${createdTiers.length} loyalty tiers`,
        data: createdTiers,
      },
      { requestId },
    );
  },
  { route: "POST /api/loyalty/tiers/initialize" },
);
