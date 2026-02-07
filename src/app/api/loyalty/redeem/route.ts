import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { LoyaltyNotificationsService } from "@/services/loyalty-notifications.service";

// POST /api/loyalty/redeem - Redeem a reward (customer portal)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, rewardId } = body;

    if (!token || !rewardId) {
      return NextResponse.json(
        { error: "Token and reward ID required" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Get the reward
    const reward = await prisma.redemptionReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    if (!reward.isActive) {
      return NextResponse.json(
        { error: "Reward is no longer available" },
        { status: 400 },
      );
    }

    // Check if customer has enough points
    if (customer.loyaltyPoints < reward.pointsCost) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 400 },
      );
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
      }).catch((err) =>
        console.error("Failed to send redemption SMS notification:", err),
      );

      return redemption;
    });

    return NextResponse.json({
      success: true,
      redemption: result,
      message: "Reward redeemed successfully!",
    });
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return NextResponse.json(
      { error: "Failed to redeem reward" },
      { status: 500 },
    );
  }
}

// GET /api/loyalty/redeem?token=xxx - Get customer's redemption history
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
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
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
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

    return NextResponse.json({ redemptions });
  } catch (error) {
    console.error("Error fetching redemptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch redemptions" },
      { status: 500 },
    );
  }
}
