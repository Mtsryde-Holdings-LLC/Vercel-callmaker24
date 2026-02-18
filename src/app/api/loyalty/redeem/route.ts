import { NextRequest } from "next/server";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { LoyaltyNotificationsService } from "@/services/loyalty-notifications.service";

// POST /api/loyalty/redeem - Redeem a reward (customer portal)
export const POST = withPublicApiHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const body = await req.json();
    const { token, rewardId } = body;

    if (!token || !rewardId) {
      return apiError("Token and reward ID required", { status: 400, requestId });
    }

    // Find customer by portal token
    const customer = await prisma.customer.findFirst({
      where: {
        portalToken: token,
        portalTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        firstName: true,
        email: true,
        loyaltyPoints: true,
        organizationId: true,
      },
    });

    if (!customer) {
      return apiError("Invalid or expired token", { status: 401, requestId });
    }

    // Get the reward
    const reward = await prisma.redemptionReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      return apiError("Reward not found", { status: 404, requestId });
    }

    if (!reward.isActive) {
      return apiError("Reward is no longer available", { status: 400, requestId });
    }

    // Check if customer has enough points
    if (customer.loyaltyPoints < reward.pointsCost) {
      return apiError("Insufficient points", { status: 400, requestId });
    }

    // Generate unique redemption code
    const code = `REWARD-${randomBytes(6).toString("hex").toUpperCase()}`;

    // Calculate expiry date
    const expiresAt = reward.expiryDays
      ? new Date(Date.now() + reward.expiryDays * 24 * 60 * 60 * 1000)
      : null;

    // Create redemption and deduct points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create redemption
      const redemption = await tx.rewardRedemption.create({
        data: {
          customerId: customer.id,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
          code,
          expiresAt,
          organizationId: customer.organizationId,
        },
        include: {
          reward: true,
        },
      });

      // Deduct points from customer
      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          loyaltyPoints: {
            decrement: reward.pointsCost,
          },
          loyaltyUsed: {
            increment: reward.pointsCost,
          },
        },
        select: {
          loyaltyPoints: true,
        },
      });

      // Send SMS notification (non-blocking)
      LoyaltyNotificationsService.sendPointsRedeemedSms({
        customerId: customer.id,
        pointsSpent: reward.pointsCost,
        newBalance: updatedCustomer.loyaltyPoints,
        rewardName: reward.name,
        organizationId: customer.organizationId!,
      }).catch(() => {});

      return redemption;
    });

    return apiSuccess({
      success: true,
      redemption: result,
      message: "Reward redeemed successfully!",
    }, { requestId });
  },
  { route: 'POST /api/loyalty/redeem', rateLimit: RATE_LIMITS.standard }
);

// GET /api/loyalty/redeem?token=xxx - Get customer's redemption history
export const GET = withPublicApiHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return apiError("Token required", { status: 400, requestId });
    }

    // Find customer by portal token
    const customer = await prisma.customer.findFirst({
      where: {
        portalToken: token,
        portalTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      return apiError("Invalid or expired token", { status: 401, requestId });
    }

    // Get redemption history
    const redemptions = await prisma.rewardRedemption.findMany({
      where: {
        customerId: customer.id,
      },
      include: {
        reward: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return apiSuccess({ redemptions }, { requestId });
  },
  { route: 'GET /api/loyalty/redeem', rateLimit: RATE_LIMITS.standard }
);
