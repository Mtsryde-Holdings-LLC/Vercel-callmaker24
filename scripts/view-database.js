/**
 * View Database Contents
 * 
 * Shows a summary of what's currently in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function viewDatabaseContents() {
  console.log('\n📊 DATABASE CONTENTS SUMMARY\n');
  console.log('='.repeat(50) + '\n');

  try {
    // Helper function to safely count records
    async function safeCount(model) {
      try {
        return await model.count();
      } catch (error) {
        return 0;
      }
    }

    // Count all main tables
    const counts = {
      users: await safeCount(prisma.user),
      customers: await safeCount(prisma.customer),
      organizations: await safeCount(prisma.organization),
      emailCampaigns: await safeCount(prisma.emailCampaign),
      emailMessages: await safeCount(prisma.emailMessage),
      smsCampaigns: await safeCount(prisma.smsCampaign),
      smsMessages: await safeCount(prisma.smsMessage),
      calls: await safeCount(prisma.call),
      chatConversations: await safeCount(prisma.chatConversation),
      sessions: await safeCount(prisma.session),
      accounts: await safeCount(prisma.account),
      apiKeys: await safeCount(prisma.apiKey),
      subscriptions: await safeCount(prisma.subscription),
      activities: await safeCount(prisma.customerActivity),
      emailLogs: await safeCount(prisma.emailLog),
      tags: await safeCount(prisma.tag),
      segments: await safeCount(prisma.segment)
    };

    console.log('📈 Record Counts:\n');
    Object.entries(counts).forEach(([table, count]) => {
      const emoji = count > 0 ? '📌' : '✓';
      console.log(`  ${emoji} ${table}: ${count}`);
    });

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`\n  📊 Total Records: ${totalRecords}\n`);

    // Show sample users if any exist
    if (counts.users > 0) {
      console.log('👥 Users:\n');
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        },
        take: 10
      });

      users.forEach(user => {
        console.log(`  - ${user.email || 'No email'}`);
        console.log(`    Name: ${user.name || 'N/A'}`);
        console.log(`    Role: ${user.role}`);
        console.log(`    Created: ${user.createdAt.toLocaleDateString()}\n`);
      });

      if (counts.users > 10) {
        console.log(`  ... and ${counts.users - 10} more users\n`);
      }
    }

    // Show sample customers if any exist
    if (counts.customers > 0) {
      console.log('🎯 Customers:\n');
      const customers = await prisma.customer.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true
        },
        take: 10
      });

      customers.forEach(customer => {
        const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
        console.log(`  - ${customer.email || 'No email'}`);
        console.log(`    Name: ${name || 'N/A'}`);
        console.log(`    Status: ${customer.status}`);
        console.log(`    Created: ${customer.createdAt.toLocaleDateString()}\n`);
      });

      if (counts.customers > 10) {
        console.log(`  ... and ${counts.customers - 10} more customers\n`);
      }
    }

    // Show organizations
    if (counts.organizations > 0) {
      console.log('🏢 Organizations:\n');
      const orgs = await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionTier: true,
          subscriptionStatus: true
        }
      });

      orgs.forEach(org => {
        console.log(`  - ${org.name} (${org.slug})`);
        console.log(`    Tier: ${org.subscriptionTier}`);
        console.log(`    Status: ${org.subscriptionStatus}\n`);
      });
    }

    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error viewing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

viewDatabaseContents()
  .then(() => {
    console.log('✅ View complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ View failed:', error);
    process.exit(1);
  });
