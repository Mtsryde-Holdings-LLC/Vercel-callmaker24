/**
 * Retroactive Tier Promotion Script
 *
 * Scans all loyalty members across all organisations and promotes
 * customers whose points qualify them for a higher tier.
 * Each promoted customer receives a discount code.
 *
 * Usage:
 *   node scripts/retroactive-promote.js            # Dry run (preview)
 *   node scripts/retroactive-promote.js --apply     # Apply promotions
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

const DEFAULT_TIERS = [
  { tier: "BRONZE", minPoints: 0, discountPercent: 0, discountAmount: 0 },
  { tier: "SILVER", minPoints: 150, discountPercent: 10, discountAmount: 0 },
  { tier: "GOLD", minPoints: 300, discountPercent: 15, discountAmount: 0 },
  { tier: "DIAMOND", minPoints: 500, discountPercent: 15, discountAmount: 10 },
];

const TIER_ORDER = ["BRONZE", "SILVER", "GOLD", "DIAMOND"];

function getQualifiedTier(points, tiers) {
  const sorted = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
  return sorted.find((t) => points >= t.minPoints) || tiers[0];
}

function formatDiscountLabel(percent, amount) {
  const parts = [];
  if (percent > 0) parts.push(`${percent}% Off`);
  if (amount > 0) parts.push(`$${amount} Off`);
  return parts.join(" + ") || "Special Offer";
}

async function getTierThresholds(organizationId) {
  try {
    const dbTiers = await prisma.loyaltyTier.findMany({
      where: { organizationId },
      orderBy: { minPoints: "asc" },
    });

    if (dbTiers.length > 0) {
      return dbTiers.map((t) => {
        let discountPercent = 0;
        let discountAmount = 0;

        if (Array.isArray(t.benefits)) {
          for (const b of t.benefits) {
            if (typeof b === "string") {
              const pMatch = b.match(/(\d+)%\s*discount/i);
              if (pMatch) discountPercent = parseInt(pMatch[1], 10);
              const aMatch = b.match(/\$(\d+(?:\.\d+)?)\s*off/i);
              if (aMatch) discountAmount = parseFloat(aMatch[1]);
            }
          }
        }

        const def = DEFAULT_TIERS.find((d) => d.tier === t.tier);
        return {
          tier: t.tier,
          minPoints: t.minPoints,
          discountPercent: discountPercent || def?.discountPercent || 0,
          discountAmount: discountAmount || def?.discountAmount || 0,
        };
      });
    }
  } catch {
    // Fall through
  }
  return [...DEFAULT_TIERS];
}

async function createPromotionReward({
  customerId,
  organizationId,
  tierName,
  discountPercent,
  discountAmount,
}) {
  const code = `TIER-${tierName}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const discountLabel = formatDiscountLabel(discountPercent, discountAmount);
  const rewardName = `${tierName} Tier Promotion - ${discountLabel}`;

  const hasPercent = discountPercent > 0;
  const hasFixed = discountAmount > 0;
  const rewardType =
    hasPercent && hasFixed
      ? "COMBO"
      : hasFixed
        ? "FIXED_AMOUNT_DISCOUNT"
        : "PERCENTAGE_DISCOUNT";

  let reward = await prisma.redemptionReward.findFirst({
    where: { name: rewardName, organizationId },
  });

  if (!reward) {
    reward = await prisma.redemptionReward.create({
      data: {
        name: rewardName,
        description: `Congratulations on reaching ${tierName} tier! Enjoy ${discountLabel} on your next purchase.`,
        pointsCost: 0,
        type: rewardType,
        discountPercent: hasPercent ? discountPercent : null,
        discountAmount: hasFixed ? discountAmount : null,
        isActive: true,
        isSingleUse: true,
        expiryDays: null,
        organizationId,
      },
    });
  }

  await prisma.rewardRedemption.create({
    data: {
      customerId,
      rewardId: reward.id,
      pointsSpent: 0,
      code,
      status: "ACTIVE",
      expiresAt: null,
      organizationId,
    },
  });

  return code;
}

async function main() {
  const apply = process.argv.includes("--apply");

  console.log("=".repeat(60));
  console.log(
    apply
      ? "🚀 RETROACTIVE TIER PROMOTION — APPLYING"
      : "👀 RETROACTIVE TIER PROMOTION — DRY RUN (preview)",
  );
  console.log("=".repeat(60));
  console.log();

  const customers = await prisma.customer.findMany({
    where: { loyaltyMember: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      loyaltyPoints: true,
      loyaltyTier: true,
      organizationId: true,
      organization: { select: { name: true } },
    },
    orderBy: { loyaltyPoints: "desc" },
  });

  console.log(`Found ${customers.length} loyalty members\n`);

  const promoted = [];
  const skipped = [];

  for (const customer of customers) {
    const name =
      [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
      "Unknown";
    const previousTier = customer.loyaltyTier || "BRONZE";
    const orgId = customer.organizationId;

    if (!orgId) {
      skipped.push({
        name,
        points: customer.loyaltyPoints,
        tier: previousTier,
        reason: "no org",
      });
      continue;
    }

    const tiers = await getTierThresholds(orgId);
    const qualifiedTier = getQualifiedTier(customer.loyaltyPoints, tiers);

    if (!qualifiedTier || qualifiedTier.tier === previousTier) {
      skipped.push({
        name,
        points: customer.loyaltyPoints,
        tier: previousTier,
        reason: "already correct",
      });
      continue;
    }

    if (
      TIER_ORDER.indexOf(qualifiedTier.tier) <= TIER_ORDER.indexOf(previousTier)
    ) {
      skipped.push({
        name,
        points: customer.loyaltyPoints,
        tier: previousTier,
        reason: "would demote",
      });
      continue;
    }

    const discountLabel = formatDiscountLabel(
      qualifiedTier.discountPercent,
      qualifiedTier.discountAmount,
    );

    if (apply) {
      // Update tier
      await prisma.customer.update({
        where: { id: customer.id },
        data: { loyaltyTier: qualifiedTier.tier },
      });

      // Create discount code
      let discountCode = null;
      if (
        qualifiedTier.discountPercent > 0 ||
        qualifiedTier.discountAmount > 0
      ) {
        discountCode = await createPromotionReward({
          customerId: customer.id,
          organizationId: orgId,
          tierName: qualifiedTier.tier,
          discountPercent: qualifiedTier.discountPercent,
          discountAmount: qualifiedTier.discountAmount,
        });
      }

      promoted.push({
        name,
        email: customer.email,
        points: customer.loyaltyPoints,
        from: previousTier,
        to: qualifiedTier.tier,
        discount: discountLabel,
        code: discountCode,
        org: customer.organization?.name,
      });
    } else {
      promoted.push({
        name,
        email: customer.email,
        points: customer.loyaltyPoints,
        from: previousTier,
        to: qualifiedTier.tier,
        discount: discountLabel,
        code: "(dry run)",
        org: customer.organization?.name,
      });
    }
  }

  // Print results
  if (promoted.length > 0) {
    console.log(
      `\n✅ ${apply ? "PROMOTED" : "WOULD PROMOTE"}: ${promoted.length} customers\n`,
    );
    console.log(
      "Name".padEnd(25) +
        "Email".padEnd(30) +
        "Points".padEnd(10) +
        "From".padEnd(12) +
        "To".padEnd(12) +
        "Discount".padEnd(20) +
        "Code",
    );
    console.log("-".repeat(130));
    for (const p of promoted) {
      console.log(
        (p.name || "").padEnd(25) +
          (p.email || "").padEnd(30) +
          String(p.points).padEnd(10) +
          p.from.padEnd(12) +
          p.to.padEnd(12) +
          p.discount.padEnd(20) +
          (p.code || "—"),
      );
    }
  } else {
    console.log("\n✅ All customers are already at their correct tier!");
  }

  if (skipped.length > 0) {
    console.log(
      `\n⏭️  Skipped: ${skipped.length} customers (already at correct tier)`,
    );
  }

  if (!apply && promoted.length > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("To apply these promotions, run:");
    console.log("  node scripts/retroactive-promote.js --apply");
    console.log("=".repeat(60));
  }

  console.log("\nDone!");
}

main()
  .catch((err) => {
    console.error("Error:", err.message);
    console.error(err.stack);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
