import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { LoyaltyNotificationsService } from "@/services/loyalty-notifications.service";

/**
 * POST /api/loyalty/adjust
 * Manually adjust loyalty points for a customer.
 * Only accessible by CORPORATE_ADMIN, SUB_ADMIN, or SUPER_ADMIN.
 *
 * Body:
 *   customerId: string   — the customer to adjust
 *   points:     number   — positive to add, negative to deduct
 *   reason:     string   — required reason for the adjustment
 */
export const POST = withApiHandler(
  async (request: NextRequest, { organizationId, session, requestId }: ApiContext) => {
    const body = await request.json();
    const { customerId, points, reason } = body;

    if (!customerId || typeof customerId !== "string") {
      return apiError("Customer ID is required", { status: 400, requestId });
    }

    if (typeof points !== "number" || points === 0 || !Number.isInteger(points)) {
      return apiError("Points must be a non-zero integer", { status: 400, requestId });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
      return apiError("A reason (at least 3 characters) is required for point adjustments", {
        status: 400,
        requestId,
      });
    }

    // Verify customer belongs to this organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        loyaltyPoints: true,
        loyaltyMember: true,
      },
    });

    if (!customer) {
      return apiError("Customer not found", { status: 404, requestId });
    }

    if (!customer.loyaltyMember) {
      return apiError("Customer is not enrolled in the loyalty program", {
        status: 400,
        requestId,
      });
    }

    // Prevent balance going negative
    if (points < 0 && customer.loyaltyPoints + points < 0) {
      return apiError(
        `Cannot deduct ${Math.abs(points)} points. Customer only has ${customer.loyaltyPoints} points.`,
        { status: 400, requestId },
      );
    }

    // Apply the adjustment
    const updateData: Record<string, unknown> = {
      loyaltyPoints: { increment: points },
    };

    // If deducting, also track usage
    if (points < 0) {
      updateData.loyaltyUsed = { increment: Math.abs(points) };
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        loyaltyPoints: true,
        loyaltyUsed: true,
        loyaltyTier: true,
      },
    });

    // Send notification for points added (non-blocking)
    if (points > 0) {
      LoyaltyNotificationsService.sendPointsEarnedSms({
        customerId: customer.id,
        pointsEarned: points,
        newBalance: updatedCustomer.loyaltyPoints,
        reason: reason.trim(),
        organizationId,
      }).catch(() => {});
    }

    return apiSuccess(
      {
        customer: updatedCustomer,
        adjustment: {
          points,
          reason: reason.trim(),
          previousBalance: customer.loyaltyPoints,
          newBalance: updatedCustomer.loyaltyPoints,
          adjustedBy: session.user.email,
        },
      },
      { status: 200, requestId },
    );
  },
  {
    route: "POST /api/loyalty/adjust",
    rateLimit: RATE_LIMITS.standard,
    roles: ["CORPORATE_ADMIN", "SUB_ADMIN", "SUPER_ADMIN"],
  },
);
