import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

// GET /api/loyalty/rewards - List all available rewards
export const GET = withApiHandler(
  async (_req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const rewards = await prisma.redemptionReward.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
      orderBy: {
        pointsCost: "asc",
      },
    });

    return apiSuccess({ rewards }, { requestId });
  },
  { route: 'GET /api/loyalty/rewards', rateLimit: RATE_LIMITS.standard }
);

// POST /api/loyalty/rewards - Create a new reward (Admin only)
export const POST = withApiHandler(
  async (req: NextRequest, { session, organizationId, requestId }: ApiContext) => {
    // Only admins can create rewards
    if (!["SUPER_ADMIN", "CORPORATE_ADMIN"].includes(session.user.role)) {
      return apiError("Forbidden", { status: 403, requestId });
    }

    const body = await req.json();
    const {
      name,
      description,
      pointsCost,
      type,
      discountPercent,
      discountAmount,
      freeItemValue,
      isSingleUse,
      expiryDays,
    } = body;

    if (!name || !pointsCost || !type) {
      return apiError("Missing required fields", { status: 400, requestId });
    }

    const reward = await prisma.redemptionReward.create({
      data: {
        name,
        description,
        pointsCost,
        type,
        discountPercent,
        discountAmount,
        freeItemValue,
        isSingleUse: isSingleUse ?? true,
        expiryDays,
        organizationId,
      },
    });

    return apiSuccess({ reward }, { requestId, status: 201 });
  },
  { route: 'POST /api/loyalty/rewards', rateLimit: RATE_LIMITS.standard }
);

// PUT /api/loyalty/rewards?id=xxx - Update a reward (Admin only)
export const PUT = withApiHandler(
  async (req: NextRequest, { session, organizationId, requestId }: ApiContext) => {
    if (!["SUPER_ADMIN", "CORPORATE_ADMIN"].includes(session.user.role)) {
      return apiError("Forbidden", { status: 403, requestId });
    }

    const rewardId = req.nextUrl.searchParams.get("id");
    if (!rewardId) {
      return apiError("Reward ID required", { status: 400, requestId });
    }

    const body = await req.json();
    const {
      name,
      description,
      pointsCost,
      type,
      discountPercent,
      discountAmount,
      freeItemValue,
      isActive,
      isSingleUse,
      expiryDays,
    } = body;

    const reward = await prisma.redemptionReward.update({
      where: { id: rewardId },
      data: {
        name,
        description,
        pointsCost,
        type,
        discountPercent,
        discountAmount,
        freeItemValue,
        isActive,
        isSingleUse,
        expiryDays,
      },
    });

    return apiSuccess({ reward }, { requestId });
  },
  { route: 'PUT /api/loyalty/rewards', rateLimit: RATE_LIMITS.standard }
);

// DELETE /api/loyalty/rewards?id=xxx - Delete a reward (Admin only)
export const DELETE = withApiHandler(
  async (req: NextRequest, { session, requestId }: ApiContext) => {
    if (!["SUPER_ADMIN", "CORPORATE_ADMIN"].includes(session.user.role)) {
      return apiError("Forbidden", { status: 403, requestId });
    }

    const rewardId = req.nextUrl.searchParams.get("id");
    if (!rewardId) {
      return apiError("Reward ID required", { status: 400, requestId });
    }

    await prisma.redemptionReward.delete({
      where: { id: rewardId },
    });

    return apiSuccess({ success: true }, { requestId });
  },
  { route: 'DELETE /api/loyalty/rewards', rateLimit: RATE_LIMITS.standard }
);
