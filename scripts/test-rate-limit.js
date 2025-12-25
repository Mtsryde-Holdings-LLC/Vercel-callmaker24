const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SMS_RATE_LIMITS = { MAX_PER_DAY: 1, COOLDOWN_HOURS: 24 };

async function checkRateLimit(customerId, organizationId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where = {
    customerId,
    direction: "OUTBOUND",
    sentAt: { gte: today },
  };

  if (organizationId) where.organizationId = organizationId;

  const messagesSentToday = await prisma.smsMessage.count({ where });

  if (messagesSentToday >= SMS_RATE_LIMITS.MAX_PER_DAY) {
    const lastMessage = await prisma.smsMessage.findFirst({
      where,
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    });

    let remainingCooldown = 0;
    if (lastMessage?.sentAt) {
      const hoursSince = (Date.now() - lastMessage.sentAt.getTime()) / 3600000;
      remainingCooldown = Math.max(
        0,
        SMS_RATE_LIMITS.COOLDOWN_HOURS - hoursSince
      );
    }

    return {
      allowed: false,
      lastMessageAt: lastMessage?.sentAt,
      remainingCooldown: Math.ceil(remainingCooldown),
      messagesSentToday,
    };
  }

  return { allowed: true, messagesSentToday };
}

async function testRateLimit() {
  try {
    console.log("🧪 Testing SMS Rate Limiting...\n");
    console.log(
      `📋 Config: ${SMS_RATE_LIMITS.MAX_PER_DAY} message/day, ${SMS_RATE_LIMITS.COOLDOWN_HOURS}h cooldown\n`
    );

    const customer = await prisma.customer.findFirst({
      where: { phone: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        organizationId: true,
      },
    });

    if (!customer) {
      console.log("❌ No customers with phone numbers found");
      return;
    }

    console.log(
      `👤 Test Customer: ${customer.firstName} ${customer.lastName} (${customer.phone})\n`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysMessages = await prisma.smsMessage.findMany({
      where: {
        customerId: customer.id,
        direction: "OUTBOUND",
        sentAt: { gte: today },
      },
      select: { sentAt: true, status: true, message: true },
      orderBy: { sentAt: "desc" },
    });

    console.log(`📊 Messages Sent Today: ${todaysMessages.length}`);
    todaysMessages.forEach((msg, i) => {
      const time = msg.sentAt?.toLocaleTimeString() || "Unknown";
      console.log(
        `  ${i + 1}. [${msg.status}] ${time} - ${msg.message.substring(
          0,
          40
        )}...`
      );
    });
    console.log("");

    const rateLimit = await checkRateLimit(
      customer.id,
      customer.organizationId
    );

    console.log("🔍 Rate Limit Check:");
    if (rateLimit.allowed) {
      console.log(
        `✅ ALLOWED - ${rateLimit.messagesSentToday || 0}/${
          SMS_RATE_LIMITS.MAX_PER_DAY
        } messages sent`
      );
    } else {
      console.log(
        `🚫 BLOCKED - ${rateLimit.messagesSentToday}/${SMS_RATE_LIMITS.MAX_PER_DAY} messages sent`
      );
      console.log(`   Last: ${rateLimit.lastMessageAt?.toLocaleString()}`);
      console.log(`   Cooldown: ${rateLimit.remainingCooldown}h remaining`);
    }
    console.log("");

    console.log("📊 All Customers Today:");
    console.log("═══════════════════════════════════════");

    const allCustomers = await prisma.customer.findMany({
      where: { phone: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        _count: {
          select: {
            smsMessages: {
              where: {
                direction: "OUTBOUND",
                sentAt: { gte: today },
              },
            },
          },
        },
      },
      orderBy: { firstName: "asc" },
    });

    allCustomers.forEach((c) => {
      const count = c._count.smsMessages;
      const status =
        count >= SMS_RATE_LIMITS.MAX_PER_DAY ? "🚫 BLOCKED" : "✅ CAN SEND";
      console.log(
        `${status} ${c.firstName} ${c.lastName} - ${count}/${SMS_RATE_LIMITS.MAX_PER_DAY} (${c.phone})`
      );
    });

    console.log("\n✨ Test complete!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testRateLimit();
