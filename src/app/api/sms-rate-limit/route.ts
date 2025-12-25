import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import {
  checkSmsRateLimit,
  getCustomerSmsStats,
  SMS_RATE_LIMITS,
} from "@/lib/sms-rate-limit";

const prisma = new PrismaClient();

// GET /api/sms-rate-limit?customerId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, organizationId: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: "Forbidden - No organization" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    // Verify customer belongs to user's organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check rate limit
    const rateLimit = await checkSmsRateLimit(customer.id, user.organizationId);

    // Get detailed stats
    const stats = await getCustomerSmsStats(customer.id, 30);

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error("Rate limit check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/sms-rate-limit/config
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      config: {
        maxPerDay: SMS_RATE_LIMITS.MAX_PER_DAY,
        cooldownHours: SMS_RATE_LIMITS.COOLDOWN_HOURS,
      },
    });
  } catch (error: any) {
    console.error("Get config error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
