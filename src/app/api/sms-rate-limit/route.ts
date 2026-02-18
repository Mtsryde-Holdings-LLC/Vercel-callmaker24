import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
  checkSmsRateLimit,
  getCustomerSmsStats,
  SMS_RATE_LIMITS,
} from "@/lib/sms-rate-limit";

// GET /api/sms-rate-limit?customerId=xxx
export const GET = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return apiError("customerId is required", { status: 400, requestId });
    }

    // Verify customer belongs to user's organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!customer) {
      return apiError("Customer not found", { status: 404, requestId });
    }

    // Check rate limit
    const rateLimit = await checkSmsRateLimit(customer.id, organizationId);

    // Get detailed stats
    const stats = await getCustomerSmsStats(customer.id, 30);

    return apiSuccess(
      {
        customer: {
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          phone: customer.phone,
        },
        rateLimit: {
          allowed: rateLimit.allowed,
          maxPerDay: SMS_RATE_LIMITS.MAX_PER_DAY,
          messagesSentToday: rateLimit.messagesSentToday,
          remainingCooldown: rateLimit.remainingCooldown,
          lastMessageAt: rateLimit.lastMessageAt,
        },
        stats: {
          last30Days: stats.total,
          today: stats.today,
          lastMessage: stats.lastMessage,
          canSendToday: stats.canSendToday,
        },
      },
      { requestId },
    );
  },
  { route: "GET /api/sms-rate-limit" },
);

// POST /api/sms-rate-limit (config endpoint)
export const POST = withApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    return apiSuccess(
      {
        config: {
          maxPerDay: SMS_RATE_LIMITS.MAX_PER_DAY,
          cooldownHours: SMS_RATE_LIMITS.COOLDOWN_HOURS,
        },
      },
      { requestId },
    );
  },
  { route: "POST /api/sms-rate-limit" },
);
