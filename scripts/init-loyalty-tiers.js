const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultTiers = [
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
    minPoints: 500,
    pointsPerDollar: 1.5,
    benefits: ["1.5 points per $1 spent", "5% discount"],
  },
  {
    tier: "GOLD",
    name: "Gold",
    minPoints: 1500,
    pointsPerDollar: 2,
    benefits: ["2 points per $1 spent", "10% discount", "Free shipping"],
  },
  {
    tier: "PLATINUM",
    name: "Platinum",
    minPoints: 3000,
    pointsPerDollar: 2.5,
    benefits: [
      "2.5 points per $1 spent",
      "15% discount",
      "Free shipping",
      "Priority support",
    ],
  },
  {
    tier: "DIAMOND",
    name: "Diamond",
    minPoints: 5000,
    pointsPerDollar: 3,
    benefits: [
      "3 points per $1 spent",
      "20% discount",
      "Free shipping",
      "Priority support",
      "Exclusive access",
    ],
  },
];

async function initializeTiers() {
  try {
    console.log('🚀 Initializing loyalty tiers for all organizations...');

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true }
    });

    console.log(`Found ${organizations.length} organization(s)`);

    for (const org of organizations) {
      console.log(`\n📊 Processing organization: ${org.name} (${org.id})`);

      // Check if tiers already exist for this organization
      const existingTiers = await prisma.loyaltyTier.findMany({
        where: { organizationId: org.id }
      });

      if (existingTiers.length > 0) {
        console.log(`  ⏭️  Skipping - already has ${existingTiers.length} tier(s)`);
        continue;
      }

      // Create default tiers for this organization
      let created = 0;
      for (const tier of defaultTiers) {
        await prisma.loyaltyTier.create({
          data: {
            ...tier,
            organizationId: org.id
          }
        });
        created++;
        console.log(`  ✅ Created ${tier.name} tier`);
      }

      console.log(`  🎉 Created ${created} tiers for ${org.name}`);
    }

    console.log('\n✨ Tier initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing tiers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeTiers();
