/**
 * Initialize Default Redemption Rewards
 *
 * This script creates the standard reward tiers:
 * - 250 points = 10% off next purchase
 * - 500 points = 15% off one purchase
 * - 1000 points = 20% off + free $10 item
 *
 * Run: node scripts/init-rewards.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_REWARDS = [
  {
    name: "10% Off Your Next Purchase",
    description:
      "Redeem 250 points for a 10% discount on your next purchase. One-time use only.",
    pointsCost: 250,
    type: "PERCENTAGE_DISCOUNT",
    discountPercent: 10,
    isSingleUse: true,
    expiryDays: null,
  },
  {
    name: "15% Off One Purchase",
    description:
      "Redeem 500 points for a 15% discount on one purchase. One-time use only.",
    pointsCost: 500,
    type: "PERCENTAGE_DISCOUNT",
    discountPercent: 15,
    isSingleUse: true,
    expiryDays: null,
  },
  {
    name: "20% Off + Free $10 Item",
    description:
      "Redeem 1000 points for a 20% discount PLUS a free item worth up to $10. One-time use only.",
    pointsCost: 1000,
    type: "COMBO",
    discountPercent: 20,
    freeItemValue: 10.0,
    isSingleUse: true,
    expiryDays: null,
  },
];

async function initRewards() {
  try {
    console.log("🎁 Initializing default redemption rewards...\n");

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    if (organizations.length === 0) {
      console.log(
        "⚠️  No organizations found. Please create an organization first."
      );
      return;
    }

    let totalCreated = 0;

    for (const org of organizations) {
      console.log(`\n📦 Setting up rewards for: ${org.name}`);

      for (const rewardData of DEFAULT_REWARDS) {
        // Check if reward already exists
        const existing = await prisma.redemptionReward.findFirst({
          where: {
            organizationId: org.id,
            pointsCost: rewardData.pointsCost,
            type: rewardData.type,
          },
        });

        if (existing) {
          console.log(
            `  ⏭️  ${rewardData.name} (${rewardData.pointsCost} pts) - Already exists`
          );
          continue;
        }

        // Create the reward
        await prisma.redemptionReward.create({
          data: {
            ...rewardData,
            organizationId: org.id,
          },
        });

        console.log(`  ✅ ${rewardData.name} (${rewardData.pointsCost} pts)`);
        totalCreated++;
      }
    }

    console.log(
      `\n✨ Done! Created ${totalCreated} reward(s) across ${organizations.length} organization(s).\n`
    );

    // Display summary
    const allRewards = await prisma.redemptionReward.findMany({
      orderBy: { pointsCost: "asc" },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    console.log("📊 Current Rewards Summary:\n");
    allRewards.forEach((reward) => {
      console.log(`  ${reward.name}`);
      console.log(`    Points: ${reward.pointsCost}`);
      console.log(`    Type: ${reward.type}`);
      if (reward.discountPercent) {
        console.log(`    Discount: ${reward.discountPercent}%`);
      }
      if (reward.freeItemValue) {
        console.log(`    Free Item: $${reward.freeItemValue}`);
      }
      console.log(`    Redeemed: ${reward._count.redemptions} times`);
      console.log(`    Status: ${reward.isActive ? "Active" : "Inactive"}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error initializing rewards:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initRewards();
