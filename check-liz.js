const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const liz = await p.customer.findMany({
    where: { firstName: { contains: "Liz", mode: "insensitive" } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      loyaltyMember: true,
      loyaltyTier: true,
      loyaltyPoints: true,
      loyaltyUsed: true,
      specialPoints: true,
      totalSpent: true,
      orderCount: true,
      lastOrderAt: true,
      source: true,
      organizationId: true,
    },
  });
  console.log("Liz customers:", JSON.stringify(liz, null, 2));

  for (const c of liz) {
    const orders = await p.order.findMany({
      where: { customerId: c.id },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        orderDate: true,
        financialStatus: true,
      },
    });
    console.log(
      `Orders for ${c.firstName} ${c.lastName}:`,
      JSON.stringify(orders, null, 2),
    );
  }

  await p.$disconnect();
})();
