const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const r = await p.rewardRedemption.updateMany({
    where: { code: { startsWith: "TIER-" } },
    data: { expiresAt: null },
  });
  console.log("Updated", r.count, "tier promotion codes to never expire");
  await p.$disconnect();
})();
