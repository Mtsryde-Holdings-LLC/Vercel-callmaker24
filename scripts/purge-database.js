/**
 * Database Purge Script
 * 
 * This script will delete ALL user-related data from the database including:
 * - Users (signups, agents, admins, etc.)
 * - Customers
 * - Email campaigns and messages
 * - SMS campaigns and messages
 * - Calls and call logs
 * - Chat conversations
 * - Sessions and accounts
 * - Activities and analytics
 * - API keys
 * - Subscriptions
 * 
 * ⚠️ WARNING: This action is IRREVERSIBLE!
 * ⚠️ Use this script carefully, preferably in development/staging only.
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function purgeDatabase() {
  console.log('\n🔥 DATABASE PURGE SCRIPT 🔥\n');
  console.log('⚠️  WARNING: This will DELETE ALL data from the following tables:');
  console.log('   - Users (all signups, agents, admins)');
  console.log('   - Customers');
  console.log('   - Email campaigns & messages');
  console.log('   - SMS campaigns & messages');
  console.log('   - Calls & call logs');
  console.log('   - Chat conversations & messages');
  console.log('   - Sessions & accounts');
  console.log('   - Customer activities');
  console.log('   - Analytics events');
  console.log('   - API keys');
  console.log('   - Subscriptions');
  console.log('   - Email logs');
  console.log('   - Verification tokens');
  console.log('\n⚠️  This action is IRREVERSIBLE!\n');

  const answer = await ask('Type "PURGE ALL DATA" to confirm: ');
  
  if (answer !== 'PURGE ALL DATA') {
    console.log('\n❌ Purge cancelled. Database remains unchanged.');
    rl.close();
    process.exit(0);
  }

  console.log('\n🚀 Starting database purge...\n');

  try {
    // Delete in order to respect foreign key constraints
    const deletionSteps = [
      {
        name: 'Verification Tokens',
        action: () => prisma.verificationToken.deleteMany({})
      },
      {
        name: 'Sessions',
        action: () => prisma.session.deleteMany({})
      },
      {
        name: 'Accounts',
        action: () => prisma.account.deleteMany({})
      },
      {
        name: 'API Keys',
        action: () => prisma.apiKey.deleteMany({})
      },
      {
        name: 'Subscriptions',
        action: () => prisma.subscription.deleteMany({})
      },
      {
        name: 'Analytics Events',
        action: () => prisma.analyticsEvent.deleteMany({})
      },
      {
        name: 'Reports',
        action: () => prisma.report.deleteMany({})
      },
      {
        name: 'Customer Activities',
        action: () => prisma.customerActivity.deleteMany({})
      },
      {
        name: 'Email Logs',
        action: () => prisma.emailLog.deleteMany({})
      },
      {
        name: 'Chat Messages',
        action: () => prisma.chatMessage.deleteMany({})
      },
      {
        name: 'Chat Conversations',
        action: () => prisma.chatConversation.deleteMany({})
      },
      {
        name: 'Call Logs',
        action: () => prisma.callLog.deleteMany({})
      },
      {
        name: 'Calls',
        action: () => prisma.call.deleteMany({})
      },
      {
        name: 'SMS Messages',
        action: () => prisma.smsMessage.deleteMany({})
      },
      {
        name: 'SMS Campaigns',
        action: () => prisma.smsCampaign.deleteMany({})
      },
      {
        name: 'Email Messages',
        action: () => prisma.emailMessage.deleteMany({})
      },
      {
        name: 'Email Campaigns',
        action: () => prisma.emailCampaign.deleteMany({})
      },
      {
        name: 'Customers',
        action: () => prisma.customer.deleteMany({})
      },
      {
        name: 'Users',
        action: () => prisma.user.deleteMany({})
      },
      {
        name: 'Tags',
        action: () => prisma.tag.deleteMany({})
      },
      {
        name: 'Segments',
        action: () => prisma.segment.deleteMany({})
      }
    ];

    let totalDeleted = 0;

    for (const step of deletionSteps) {
      try {
        console.log(`Deleting ${step.name}...`);
        const result = await step.action();
        const count = result.count || 0;
        totalDeleted += count;
        console.log(`✅ Deleted ${count} ${step.name}`);
      } catch (error) {
        if (error.code === 'P2025') {
          // Record not found - that's okay, table might be empty
          console.log(`✓ ${step.name} - table empty or already cleared`);
        } else {
          console.error(`❌ Error deleting ${step.name}:`, error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ PURGE COMPLETE!`);
    console.log(`📊 Total records deleted: ${totalDeleted}`);
    console.log('='.repeat(50) + '\n');

    // Verify key tables are empty
    console.log('🔍 Verifying purge...\n');
    
    const verifications = [
      { name: 'Users', count: await prisma.user.count() },
      { name: 'Customers', count: await prisma.customer.count() },
      { name: 'Email Campaigns', count: await prisma.emailCampaign.count() },
      { name: 'SMS Campaigns', count: await prisma.smsCampaign.count() },
      { name: 'Sessions', count: await prisma.session.count() },
      { name: 'Accounts', count: await prisma.account.count() }
    ];

    let allClear = true;
    for (const verification of verifications) {
      const status = verification.count === 0 ? '✅' : '⚠️';
      console.log(`${status} ${verification.name}: ${verification.count} records`);
      if (verification.count > 0) allClear = false;
    }

    if (allClear) {
      console.log('\n✅ All verified tables are empty. Database purged successfully!');
    } else {
      console.log('\n⚠️ Some tables still contain records. Please review.');
    }

  } catch (error) {
    console.error('\n❌ Error during purge:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Run the purge
purgeDatabase()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
