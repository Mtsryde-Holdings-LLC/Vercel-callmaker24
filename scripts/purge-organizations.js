/**
 * Purge Organizations Script
 * 
 * Deletes all organizations from the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function purgeOrganizations() {
  console.log('\n🏢 PURGE ORGANIZATIONS SCRIPT\n');

  try {
    // Get all organizations
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    console.log(`Found ${orgs.length} organizations:\n`);
    orgs.forEach(org => {
      console.log(`  - ${org.name} (${org.slug})`);
    });

    if (orgs.length === 0) {
      console.log('\n✅ No organizations found. Database is clean!');
      return;
    }

    console.log('\n🚀 Deleting all organizations...\n');

    // Delete all organizations
    const result = await prisma.organization.deleteMany({});

    console.log(`✅ Deleted ${result.count} organizations\n`);

    // Verify
    const remainingOrgs = await prisma.organization.count();
    console.log(`📊 Remaining organizations: ${remainingOrgs}\n`);

    if (remainingOrgs === 0) {
      console.log('✅ All organizations deleted successfully!');
    } else {
      console.log('⚠️  Some organizations still remain.');
    }

  } catch (error) {
    console.error('\n❌ Error purging organizations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

purgeOrganizations()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
