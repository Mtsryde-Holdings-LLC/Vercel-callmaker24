/**
 * Update existing loyalty tiers in the database to the new thresholds.
 * Also removes PLATINUM tier if present.
 *
 * New thresholds:
 *   BRONZE  = 0 pts
 *   SILVER  = 150 pts (10% discount)
 *   GOLD    = 300 pts (15% discount)
 *   DIAMOND = 500 pts (15% + $10 off)
 */

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const NEW_TIERS = [
  {
    tier: "BRONZE",
    name: "Bronze",
    minPoints: 0,
    pointsPerDollar: 1,
    benefits: ["1 point per $1 spent"],
  },
  {
    tier: "SILVER",
    name: "Silver",
    minPoints: 150,
    pointsPerDollar: 1.5,
    benefits: ["1.5 points per $1 spent", "10% discount"],
  },
  {
    tier: "GOLD",
    name: "Gold",
    minPoints: 300,
    pointsPerDollar: 2,
    benefits: ["2 points per $1 spent", "15% discount", "Free shipping"],
  },
  {
    tier: "DIAMOND",
    name: "Diamond",
    minPoints: 500,
    pointsPerDollar: 3,
    benefits: [
      "3 points per $1 spent",
      "15% discount + $10 off",
      "Free shipping",
      "Priority support",
      "Exclusive access",
    ],
  },
];

(async () => {
  // Get all orgs that have tiers
  const allTiers = await p.loyaltyTier.findMany({
    select: { id: true, tier: true, minPoints: true, organizationId: true },
    orderBy: { minPoints: "asc" },
  });

  const orgIds = [
    ...new Set(allTiers.map((t) => t.organizationId).filter(Boolean)),
  ];
  console.log(`Found ${orgIds.length} organization(s) with tier configs\n`);

  for (const orgId of orgIds) {
    console.log(`Updating org: ${orgId}`);

    // Delete PLATINUM tier if it exists
    const platinum = allTiers.find(
      (t) => t.organizationId === orgId && t.tier === "PLATINUM",
    );
    if (platinum) {
      // First move any PLATINUM customers to GOLD (or keep at their level based on points)
      const platinumCustomers = await p.customer.count({
        where: { organizationId: orgId, loyaltyTier: "PLATINUM" },
      });
      if (platinumCustomers > 0) {
        console.log(`  Moving ${platinumCustomers} PLATINUM customers to GOLD`);
        await p.customer.updateMany({
          where: { organizationId: orgId, loyaltyTier: "PLATINUM" },
          data: { loyaltyTier: "GOLD" },
        });
      }
      await p.loyaltyTier.delete({ where: { id: platinum.id } });
      console.log("  Deleted PLATINUM tier");
    }

    // Update remaining tiers
    for (const newTier of NEW_TIERS) {
      const existing = allTiers.find(
        (t) => t.organizationId === orgId && t.tier === newTier.tier,
      );
      if (existing) {
        await p.loyaltyTier.update({
          where: { id: existing.id },
          data: {
            name: newTier.name,
            minPoints: newTier.minPoints,
            pointsPerDollar: newTier.pointsPerDollar,
            benefits: newTier.benefits,
          },
        });
        console.log(
          `  Updated ${newTier.tier}: ${existing.minPoints} → ${newTier.minPoints} pts`,
        );
      } else {
        await p.loyaltyTier.create({
          data: {
            ...newTier,
            organizationId: orgId,
          },
        });
        console.log(`  Created ${newTier.tier}: ${newTier.minPoints} pts`);
      }
    }

    console.log();
  }

  // Verify
  const updated = await p.loyaltyTier.findMany({
    orderBy: { minPoints: "asc" },
  });
  console.log("Updated tiers:");
  console.table(
    updated.map((t) => ({
      org: t.organizationId,
      tier: t.tier,
      minPoints: t.minPoints,
    })),
  );

  console.log("\nDone!");
  await p.$disconnect();
})();
