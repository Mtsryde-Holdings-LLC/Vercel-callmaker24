const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  // Find customers with >= 150 points who are still BRONZE
  const customers = await p.customer.findMany({
    where: {
      loyaltyMember: true,
      loyaltyPoints: { gte: 150 },
      loyaltyTier: "BRONZE",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      loyaltyPoints: true,
      loyaltyTier: true,
      organizationId: true,
    },
    orderBy: { loyaltyPoints: "desc" },
  });

  console.log(`Found ${customers.length} BRONZE customers with >= 150 pts:\n`);
  for (const c of customers) {
    console.log(
      `  ${c.firstName} ${c.lastName} | ${c.email} | ${c.loyaltyPoints} pts | tier: ${c.loyaltyTier} | org: ${c.organizationId}`,
    );
  }

  // Check if these orgs have custom tiers in DB
  if (customers.length > 0) {
    const orgIds = [
      ...new Set(customers.map((c) => c.organizationId).filter(Boolean)),
    ];
    for (const orgId of orgIds) {
      const tiers = await p.loyaltyTier.findMany({
        where: { organizationId: orgId },
        orderBy: { minPoints: "asc" },
      });
      console.log(`\nOrg ${orgId} has ${tiers.length} tiers in DB:`);
      if (tiers.length > 0) {
        console.table(
          tiers.map((t) => ({ tier: t.tier, minPoints: t.minPoints })),
        );
      } else {
        console.log("  (none — will use defaults)");
      }
    }
  }

  await p.$disconnect();
})();
