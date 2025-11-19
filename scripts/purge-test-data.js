/**
 * Purge Test Data Script
 * 
 * This is a SAFER version that only deletes obvious test/placeholder data:
 * - Users with test emails (test@, demo@, example@)
 * - Customers with test emails or placeholder names
 * - Their associated data (campaigns, messages, etc.)
 * 
 * This preserves production/real user data.
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

// Patterns to identify test data
const TEST_EMAIL_PATTERNS = [
  /test@/i,
  /demo@/i,
  /example@/i,
  /placeholder@/i,
  /fake@/i,
  /sample@/i,
  /admin@test/i,
  /user@test/i,
  /@mailinator/i,
  /@guerrillamail/i,
  /@tempmail/i
];

const TEST_NAME_PATTERNS = [
  /test user/i,
  /demo user/i,
  /placeholder/i,
  /sample user/i,
  /john doe/i,
  /jane doe/i,
  /test agent/i,
  /demo agent/i
];

function isTestEmail(email) {
  if (!email) return false;
  return TEST_EMAIL_PATTERNS.some(pattern => pattern.test(email));
}

function isTestName(name) {
  if (!name) return false;
  return TEST_NAME_PATTERNS.some(pattern => pattern.test(name));
}

async function purgeTestData() {
  console.log('\n🧹 PURGE TEST DATA SCRIPT 🧹\n');
  console.log('This script will delete test/placeholder data including:');
  console.log('   - Users with test emails (test@, demo@, example@)');
  console.log('   - Customers with test emails or placeholder names');
  console.log('   - Associated campaigns, messages, activities');
  console.log('\n✅ Real production data will be preserved\n');

  const answer = await ask('Type "YES" to continue: ');
  
  if (answer !== 'YES') {
    console.log('\n❌ Operation cancelled.');
    rl.close();
    process.exit(0);
  }

  console.log('\n🔍 Identifying test data...\n');

  try {
    // Find test users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    const testUserIds = allUsers
      .filter(user => isTestEmail(user.email) || isTestName(user.name))
      .map(user => user.id);

    console.log(`Found ${testUserIds.length} test users:`);
    allUsers
      .filter(user => testUserIds.includes(user.id))
      .forEach(user => {
        console.log(`  - ${user.email || 'No email'} (${user.name || 'No name'}) - ${user.role}`);
      });

    // Find test customers
    const allCustomers = await prisma.customer.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    const testCustomerIds = allCustomers
      .filter(customer => {
        const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
        return isTestEmail(customer.email) || isTestName(fullName);
      })
      .map(customer => customer.id);

    console.log(`\nFound ${testCustomerIds.length} test customers:`);
    allCustomers
      .filter(customer => testCustomerIds.includes(customer.id))
      .forEach(customer => {
        const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
        console.log(`  - ${customer.email || 'No email'} (${name || 'No name'})`);
      });

    if (testUserIds.length === 0 && testCustomerIds.length === 0) {
      console.log('\n✅ No test data found. Database is clean!');
      rl.close();
      process.exit(0);
    }

    console.log('\n⚠️  This will delete the above test data and all associated records.\n');
    const confirmAnswer = await ask('Type "DELETE" to confirm: ');
    
    if (confirmAnswer !== 'DELETE') {
      console.log('\n❌ Deletion cancelled.');
      rl.close();
      process.exit(0);
    }

    console.log('\n🚀 Starting deletion...\n');

    let totalDeleted = 0;

    // Delete data associated with test users
    if (testUserIds.length > 0) {
      console.log('Deleting test user data...');

      // Delete sessions
      const sessions = await prisma.session.deleteMany({
        where: { userId: { in: testUserIds } }
      });
      console.log(`  ✓ Deleted ${sessions.count} sessions`);
      totalDeleted += sessions.count;

      // Delete accounts
      const accounts = await prisma.account.deleteMany({
        where: { userId: { in: testUserIds } }
      });
      console.log(`  ✓ Deleted ${accounts.count} accounts`);
      totalDeleted += accounts.count;

      // Delete API keys
      const apiKeys = await prisma.apiKey.deleteMany({
        where: { userId: { in: testUserIds } }
      });
      console.log(`  ✓ Deleted ${apiKeys.count} API keys`);
      totalDeleted += apiKeys.count;

      // Delete subscriptions
      const subscriptions = await prisma.subscription.deleteMany({
        where: { userId: { in: testUserIds } }
      });
      console.log(`  ✓ Deleted ${subscriptions.count} subscriptions`);
      totalDeleted += subscriptions.count;

      // Delete campaigns
      const emailCampaigns = await prisma.emailCampaign.deleteMany({
        where: { userId: { in: testUserIds } }
      });
      console.log(`  ✓ Deleted ${emailCampaigns.count} email campaigns`);
      totalDeleted += emailCampaigns.count;

      const smsCampaigns = await prisma.smsCampaign.deleteMany({
        where: { userId: { in: testUserIds } }
      });
      console.log(`  ✓ Deleted ${smsCampaigns.count} SMS campaigns`);
      totalDeleted += smsCampaigns.count;

      // Delete calls
      const calls = await prisma.call.deleteMany({
        where: { userId: { in: testUserIds } }
      });
      console.log(`  ✓ Deleted ${calls.count} calls`);
      totalDeleted += calls.count;

      // Delete chat conversations
      const chats = await prisma.chatConversation.deleteMany({
        where: { userId: { in: testUserIds } }
      });
      console.log(`  ✓ Deleted ${chats.count} chat conversations`);
      totalDeleted += chats.count;
    }

    // Delete data associated with test customers
    if (testCustomerIds.length > 0) {
      console.log('\nDeleting test customer data...');

      // Delete customer activities
      const activities = await prisma.customerActivity.deleteMany({
        where: { customerId: { in: testCustomerIds } }
      });
      console.log(`  ✓ Deleted ${activities.count} customer activities`);
      totalDeleted += activities.count;

      // Delete email messages
      const emailMessages = await prisma.emailMessage.deleteMany({
        where: { customerId: { in: testCustomerIds } }
      });
      console.log(`  ✓ Deleted ${emailMessages.count} email messages`);
      totalDeleted += emailMessages.count;

      // Delete SMS messages
      const smsMessages = await prisma.smsMessage.deleteMany({
        where: { customerId: { in: testCustomerIds } }
      });
      console.log(`  ✓ Deleted ${smsMessages.count} SMS messages`);
      totalDeleted += smsMessages.count;

      // Delete calls to customers
      const customerCalls = await prisma.call.deleteMany({
        where: { customerId: { in: testCustomerIds } }
      });
      console.log(`  ✓ Deleted ${customerCalls.count} calls to customers`);
      totalDeleted += customerCalls.count;

      // Delete chat conversations with customers
      const customerChats = await prisma.chatConversation.deleteMany({
        where: { customerId: { in: testCustomerIds } }
      });
      console.log(`  ✓ Deleted ${customerChats.count} customer chats`);
      totalDeleted += customerChats.count;

      // Delete customers
      const customers = await prisma.customer.deleteMany({
        where: { id: { in: testCustomerIds } }
      });
      console.log(`  ✓ Deleted ${customers.count} customers`);
      totalDeleted += customers.count;
    }

    // Finally delete test users
    if (testUserIds.length > 0) {
      const users = await prisma.user.deleteMany({
        where: { id: { in: testUserIds } }
      });
      console.log(`\n  ✓ Deleted ${users.count} users`);
      totalDeleted += users.count;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ TEST DATA PURGE COMPLETE!`);
    console.log(`📊 Total records deleted: ${totalDeleted}`);
    console.log('='.repeat(50) + '\n');

    // Show remaining counts
    console.log('📊 Remaining data:\n');
    const remainingUsers = await prisma.user.count();
    const remainingCustomers = await prisma.customer.count();
    const remainingCampaigns = await prisma.emailCampaign.count();
    
    console.log(`  Users: ${remainingUsers}`);
    console.log(`  Customers: ${remainingCustomers}`);
    console.log(`  Email Campaigns: ${remainingCampaigns}`);

  } catch (error) {
    console.error('\n❌ Error during purge:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Run the purge
purgeTestData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
