import { prisma } from "@/lib/prisma";

/**
 * Rate limiting configuration for SMS messages
 */
export const SMS_RATE_LIMITS = {
  MAX_PER_DAY: 1, // Maximum messages per customer per day
  COOLDOWN_HOURS: 24, // Hours before customer can receive another message
};

/**
 * Check if a customer has already received a message today
 * @param customerId - Customer ID to check
 * @param organizationId - Organization ID (optional, for multi-tenant)
 * @returns Object with { allowed: boolean, lastMessageAt?: Date, remainingCooldown?: number }
 */
export async function checkSmsRateLimit(
  customerId: string,
  organizationId?: string,
): Promise<{
  allowed: boolean;
  lastMessageAt?: Date;
  remainingCooldown?: number;
  messagesSentToday?: number;
}> {
  try {
    // Calculate start of today (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count messages sent to this customer today
    const where: any = {
      customerId,
      direction: "OUTBOUND",
      sentAt: {
        gte: today,
      },
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const messagesSentToday = await prisma.smsMessage.count({
      where,
    });

    // If customer has already received max messages today, deny
    if (messagesSentToday >= SMS_RATE_LIMITS.MAX_PER_DAY) {
      // Get the last message sent
      const lastMessage = await prisma.smsMessage.findFirst({
        where,
        orderBy: { sentAt: "desc" },
        select: { sentAt: true },
      });

      // Calculate remaining cooldown in hours
      let remainingCooldown = 0;
      if (lastMessage?.sentAt) {
        const hoursSinceLastMessage =
          (Date.now() - lastMessage.sentAt.getTime()) / (1000 * 60 * 60);
        remainingCooldown = Math.max(
          0,
          SMS_RATE_LIMITS.COOLDOWN_HOURS - hoursSinceLastMessage,
        );
      }

      return {
        allowed: false,
        lastMessageAt: lastMessage?.sentAt ?? undefined,
        remainingCooldown: Math.ceil(remainingCooldown),
        messagesSentToday,
      };
    }

    // Customer is within rate limit
    return {
      allowed: true,
      messagesSentToday,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // On error, allow the message (fail open for availability)
    return { allowed: true };
  }
}

/**
 * Check rate limits for multiple customers at once
 * @param customerIds - Array of customer IDs
 * @param organizationId - Organization ID (optional)
 * @returns Map of customerId -> rate limit result
 */
export async function checkBatchSmsRateLimit(
  customerIds: string[],
  organizationId?: string,
): Promise<Map<string, { allowed: boolean; reason?: string }>> {
  const results = new Map<string, { allowed: boolean; reason?: string }>();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all messages sent today for these customers
    const where: any = {
      customerId: { in: customerIds },
      direction: "OUTBOUND",
      sentAt: { gte: today },
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const todaysMessages = await prisma.smsMessage.groupBy({
      by: ["customerId"],
      where,
      _count: {
        id: true,
      },
    });

    // Create a map of customer -> message count
    const messageCountMap = new Map<string, number>();
    todaysMessages.forEach((result) => {
      messageCountMap.set(result.customerId, result._count.id);
    });

    // Check each customer
    customerIds.forEach((customerId) => {
      const messagesCount = messageCountMap.get(customerId) || 0;

      if (messagesCount >= SMS_RATE_LIMITS.MAX_PER_DAY) {
        results.set(customerId, {
          allowed: false,
          reason: `Rate limit: ${messagesCount} message(s) already sent today`,
        });
      } else {
        results.set(customerId, { allowed: true });
      }
    });

    return results;
  } catch (error) {
    console.error("Batch rate limit check error:", error);
    // On error, allow all messages
    customerIds.forEach((id) => results.set(id, { allowed: true }));
    return results;
  }
}

/**
 * Get SMS statistics for a customer
 * @param customerId - Customer ID
 * @param days - Number of days to look back (default: 30)
 */
export async function getCustomerSmsStats(
  customerId: string,
  days: number = 30,
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const messages = await prisma.smsMessage.findMany({
    where: {
      customerId,
      direction: "OUTBOUND",
      sentAt: { gte: startDate },
    },
    select: {
      sentAt: true,
      status: true,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const messagesToday = messages.filter(
    (m) => m.sentAt && m.sentAt >= today,
  ).length;

  return {
    total: messages.length,
    today: messagesToday,
    lastMessage: messages.length > 0 ? messages[0].sentAt : null,
    canSendToday: messagesToday < SMS_RATE_LIMITS.MAX_PER_DAY,
  };
}
