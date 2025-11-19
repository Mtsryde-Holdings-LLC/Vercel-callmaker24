#!/usr/bin/env node

/**
 * Stripe Webhook Testing Script
 * Tests all webhook events locally
 * Run with: node scripts/test-stripe-webhooks.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const WEBHOOK_EVENTS = [
  {
    name: 'Customer Subscription Created',
    event: 'customer.subscription.created',
    description: 'Simulates a new subscription being created'
  },
  {
    name: 'Customer Subscription Updated',
    event: 'customer.subscription.updated',
    description: 'Simulates a subscription being modified'
  },
  {
    name: 'Customer Subscription Deleted',
    event: 'customer.subscription.deleted',
    description: 'Simulates a subscription cancellation'
  },
  {
    name: 'Invoice Paid',
    event: 'invoice.paid',
    description: 'Simulates successful payment'
  },
  {
    name: 'Invoice Payment Failed',
    event: 'invoice.payment_failed',
    description: 'Simulates failed payment'
  }
];

async function testWebhookEvent(event) {
  log(`\nTesting: ${event.name}`, 'yellow');
  log(`Event: ${event.event}`, 'blue');
  log(`Description: ${event.description}`, 'blue');
  
  try {
    log('\nSending test webhook...', 'yellow');
    
    const command = `stripe trigger ${event.event}`;
    const output = execSync(command, { encoding: 'utf-8' });
    
    log('✓ Webhook triggered successfully', 'green');
    log('\nResponse:', 'blue');
    console.log(output);
    
    return true;
  } catch (error) {
    log('✗ Failed to trigger webhook', 'red');
    log(error.message, 'red');
    return false;
  }
}

async function startWebhookForwarding() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('WEBHOOK FORWARDING', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  log('\nStarting webhook forwarding to localhost:3000...', 'yellow');
  log('This will forward Stripe webhooks to your local dev server', 'blue');
  log('\nMake sure your dev server is running (npm run dev)', 'yellow');
  log('\nPress Ctrl+C to stop forwarding\n', 'blue');
  
  try {
    const command = 'stripe listen --forward-to http://localhost:3000/api/webhooks/stripe';
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    // Ctrl+C will cause an error, which is expected
    log('\n✓ Webhook forwarding stopped', 'green');
  }
}

async function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
  log('   STRIPE WEBHOOK TESTING TOOL', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
  
  log('\nOptions:', 'bright');
  log('  1. Start webhook forwarding (listen for all events)', 'blue');
  log('  2. Test specific webhook events', 'blue');
  log('  3. Test all webhook events sequentially', 'blue');
  log('  4. Exit', 'blue');
  
  const choice = await new Promise((resolve) => {
    rl.question('\nSelect option (1-4): ', resolve);
  });
  
  switch (choice.trim()) {
    case '1':
      await startWebhookForwarding();
      break;
      
    case '2':
      log('\nAvailable webhook events:', 'bright');
      WEBHOOK_EVENTS.forEach((event, index) => {
        log(`  ${index + 1}. ${event.name}`, 'blue');
      });
      
      const eventChoice = await new Promise((resolve) => {
        rl.question(`\nSelect event (1-${WEBHOOK_EVENTS.length}): `, resolve);
      });
      
      const eventIndex = parseInt(eventChoice.trim()) - 1;
      if (eventIndex >= 0 && eventIndex < WEBHOOK_EVENTS.length) {
        await testWebhookEvent(WEBHOOK_EVENTS[eventIndex]);
      } else {
        log('Invalid choice', 'red');
      }
      break;
      
    case '3':
      log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
      log('TESTING ALL WEBHOOK EVENTS', 'bright');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
      
      let successCount = 0;
      for (const event of WEBHOOK_EVENTS) {
        if (await testWebhookEvent(event)) {
          successCount++;
        }
        
        // Wait a bit between events
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
      log(`✓ Completed: ${successCount}/${WEBHOOK_EVENTS.length} events tested successfully`, 'bright');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
      break;
      
    case '4':
      log('\nGoodbye! 👋', 'blue');
      break;
      
    default:
      log('Invalid choice', 'red');
  }
  
  rl.close();
}

main().catch((error) => {
  log(`\n✗ Error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});
