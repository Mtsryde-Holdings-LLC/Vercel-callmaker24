const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const r = await p.customer.groupBy({
    by: ["loyaltyTier"],
    where: { loyaltyMember: true },
    _count: true,
    _min: { loyaltyPoints: true },
    _max: { loyaltyPoints: true },
    _avg: { loyaltyPoints: true },
  });

  console.log("\nLoyalty Tier Distribution:");
  console.table(
    r.map((x) => ({
      tier: x.loyaltyTier,
      count: x._count,
      minPts: x._min.loyaltyPoints,
      maxPts: x._max.loyaltyPoints,
      avgPts: Math.round(x._avg.loyaltyPoints || 0),
    }))
  );

  const above150 = await p.customer.count({
    where: { loyaltyMember: true, loyaltyPoints: { gte: 150 } },
  });
  console.log("Customers with >= 150 pts:", above150);

  await p.$disconnect();
})();
