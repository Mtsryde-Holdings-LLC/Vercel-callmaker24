const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

/**
 * Retroactively award loyalty points to all loyalty members
 * who have paid orders but 0 loyalty points.
 *
 * Points = 1 per $1 spent (Math.floor of totalSpent from paid orders)
 */
(async () => {
  console.log("=== Retroactive Loyalty Points Fix ===\n");

  // Find all loyalty members with 0 points but who have orders
  const affected = await p.customer.findMany({
    where: {
      loyaltyMember: true,
      loyaltyPoints: 0,
      orderCount: { gt: 0 },
    },
    include: {
      orders: {
        select: {
          id: true,
          totalAmount: true,
          total: true,
          status: true,
          financialStatus: true,
        },
      },
    },
  });

  console.log(
    `Found ${affected.length} loyalty members with 0 points but have orders:\n`,
  );

  let fixed = 0;

  for (const customer of affected) {
    // Only count paid/fulfilled, non-refunded orders
    const paidOrders = customer.orders.filter(
      (o) =>
        (o.financialStatus === "paid" ||
          o.status === "FULFILLED" ||
          o.status === "completed") &&
        o.financialStatus !== "refunded" &&
        o.financialStatus !== "partially_refunded",
    );

    const earnedPoints = paidOrders.reduce(
      (sum, o) => sum + Math.floor(o.totalAmount || o.total || 0),
      0,
    );

    if (earnedPoints > 0) {
      console.log(
        `  ${customer.firstName} ${customer.lastName} (${customer.email || "no email"})` +
          ` — ${paidOrders.length} paid orders, totalSpent: $${customer.totalSpent}` +
          ` → awarding ${earnedPoints} points`,
      );

      await p.customer.update({
        where: { id: customer.id },
        data: { loyaltyPoints: earnedPoints },
      });

      fixed++;
    } else {
      console.log(
        `  ${customer.firstName} ${customer.lastName} — no qualifying paid orders, skipping`,
      );
    }
  }

  console.log(
    `\n✅ Fixed ${fixed} customers out of ${affected.length} affected.`,
  );

  await p.$disconnect();
})();
