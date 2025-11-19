#!/usr/bin/env node

/**
 * Automated Stripe Setup Script
 * Uses Stripe CLI commands to create products, prices, and configure webhooks
 * Run with: node scripts/setup-stripe.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Subscription plans configuration
const PLANS = [
  {
    name: 'STARTER',
    displayName: 'Starter Plan',
    description: 'Perfect for small teams getting started',
    monthly: 4999, // $49.99 in cents
    annual: 50989,  // $509.89 in cents (15% discount)
    features: [
      '1 agent',
      '500 customers',
      '1,000 email credits/month',
      '500 SMS credits/month',
      '2,000 AI credits/month'
    ]
  },
  {
    name: 'ELITE',
    displayName: 'Elite Plan',
    description: 'Most popular - Great for growing businesses',
    monthly: 7999, // $79.99
    annual: 81589, // $815.89
    features: [
      '3 agents',
      '2,000 customers',
      '5,000 email credits/month',
      '2,000 SMS credits/month',
      '10,000 AI credits/month'
    ]
  },
  {
    name: 'PRO',
    displayName: 'Pro Plan',
    description: 'Advanced features for scaling teams',
    monthly: 12999, // $129.99
    annual: 132589, // $1,325.89
    features: [
      '5 agents',
      '10,000 customers',
      '25,000 email credits/month',
      '10,000 SMS credits/month',
      '50,000 AI credits/month'
    ]
  },
  {
    name: 'ENTERPRISE',
    displayName: 'Enterprise Plan',
    description: 'Full-featured solution for large organizations',
    monthly: 49999, // $499.99
    annual: 509989, // $5,099.89
    features: [
      '15 agents',
      'Unlimited customers',
      '100,000 email credits/month',
      '50,000 SMS credits/month',
      '200,000 AI credits/month'
    ]
  }
];

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

function execCommand(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    if (!silent) log(output, 'blue');
    return output;
  } catch (error) {
    log(`Error executing command: ${command}`, 'red');
    log(error.message, 'red');
    throw error;
  }
}

function checkStripeCliInstalled() {
  try {
    execCommand('stripe --version', true);
    return true;
  } catch (error) {
    return false;
  }
}

function updateEnvFile(envVars) {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Update or add each variable
  Object.entries(envVars).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  fs.writeFileSync(envPath, envContent.trim() + '\n');
  log(`✓ Updated .env.local with ${Object.keys(envVars).length} variables`, 'green');
}

async function createStripeProduct(plan, interval) {
  const amount = interval === 'monthly' ? plan.monthly : plan.annual;
  const intervalLabel = interval === 'monthly' ? 'month' : 'year';
  
  log(`\nCreating ${plan.displayName} - ${interval}...`, 'yellow');
  
  try {
    // Create product
    const productOutput = execCommand(
      `stripe products create --name="${plan.displayName}" --description="${plan.description}"`,
      true
    );
    
    const productId = productOutput.match(/id: (prod_[^\s]+)/)?.[1];
    
    if (!productId) {
      throw new Error('Failed to extract product ID');
    }
    
    log(`  ✓ Product created: ${productId}`, 'green');
    
    // Create price
    const priceOutput = execCommand(
      `stripe prices create --product=${productId} --unit-amount=${amount} --currency=usd --recurring[interval]=${intervalLabel}`,
      true
    );
    
    const priceId = priceOutput.match(/id: (price_[^\s]+)/)?.[1];
    
    if (!priceId) {
      throw new Error('Failed to extract price ID');
    }
    
    log(`  ✓ Price created: ${priceId} ($${(amount / 100).toFixed(2)}/${intervalLabel})`, 'green');
    
    return { productId, priceId };
    
  } catch (error) {
    log(`  ✗ Failed to create ${plan.displayName} - ${interval}`, 'red');
    throw error;
  }
}

async function setupWebhook() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('WEBHOOK SETUP', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  const webhookUrl = await question('\nEnter your webhook URL (or press Enter to skip for now): ');
  
  if (!webhookUrl || webhookUrl.trim() === '') {
    log('\nSkipping webhook creation. You can set it up later in Stripe Dashboard.', 'yellow');
    log('Webhook URL will be: https://your-domain.com/api/webhooks/stripe', 'blue');
    return null;
  }
  
  try {
    const output = execCommand(
      `stripe webhook_endpoints create ` +
      `--url="${webhookUrl}/api/webhooks/stripe" ` +
      `--enabled-events=customer.subscription.created,` +
      `customer.subscription.updated,` +
      `customer.subscription.deleted,` +
      `invoice.paid,` +
      `invoice.payment_failed`,
      true
    );
    
    const webhookSecret = output.match(/secret: (whsec_[^\s]+)/)?.[1];
    
    if (webhookSecret) {
      log('  ✓ Webhook endpoint created successfully', 'green');
      return webhookSecret;
    }
    
    return null;
  } catch (error) {
    log('  ✗ Failed to create webhook endpoint', 'red');
    log('  You can create it manually in the Stripe Dashboard', 'yellow');
    return null;
  }
}

async function getStripeKeys() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('API KEYS', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  log('\nRetrieving your Stripe API keys...', 'yellow');
  
  try {
    // Get secret key
    const secretKeyOutput = execCommand('stripe config --list', true);
    const secretKey = secretKeyOutput.match(/test_mode_api_key = (sk_test_[^\s]+)/)?.[1];
    
    if (!secretKey) {
      throw new Error('Could not retrieve secret key');
    }
    
    log('  ✓ Secret key retrieved', 'green');
    
    // Get publishable key (note: this might need manual entry)
    const pubKey = await question('\nEnter your Stripe Publishable Key (starts with pk_test_): ');
    
    return {
      secretKey,
      publishableKey: pubKey.trim()
    };
  } catch (error) {
    log('  ✗ Could not automatically retrieve keys', 'red');
    log('\nPlease enter them manually:', 'yellow');
    
    const secretKey = await question('Secret Key (sk_test_...): ');
    const pubKey = await question('Publishable Key (pk_test_...): ');
    
    return {
      secretKey: secretKey.trim(),
      publishableKey: pubKey.trim()
    };
  }
}

async function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
  log('   CALLMAKER24 STRIPE AUTOMATION SETUP', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
  
  // Check if Stripe CLI is installed
  if (!checkStripeCliInstalled()) {
    log('\n✗ Stripe CLI not found!', 'red');
    log('\nPlease install Stripe CLI first:', 'yellow');
    log('  Windows: scoop install stripe', 'blue');
    log('  Mac: brew install stripe/stripe-cli/stripe', 'blue');
    log('  Or download from: https://stripe.com/docs/stripe-cli', 'blue');
    log('\nAfter installation, run: stripe login', 'yellow');
    process.exit(1);
  }
  
  log('\n✓ Stripe CLI detected', 'green');
  
  // Check if logged in
  log('\nChecking Stripe authentication...', 'yellow');
  try {
    execCommand('stripe config --list', true);
    log('✓ Authenticated with Stripe', 'green');
  } catch (error) {
    log('✗ Not logged in to Stripe', 'red');
    log('\nPlease run: stripe login', 'yellow');
    process.exit(1);
  }
  
  // Get API keys
  const keys = await getStripeKeys();
  
  // Create products and prices
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('CREATING PRODUCTS & PRICES', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('\nThis will create 4 products with 8 prices (monthly + annual for each)\n', 'yellow');
  
  const envVars = {
    STRIPE_SECRET_KEY: keys.secretKey,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: keys.publishableKey
  };
  
  for (const plan of PLANS) {
    // Create monthly price
    const monthly = await createStripeProduct(plan, 'monthly');
    envVars[`STRIPE_PRICE_ID_${plan.name}_MONTHLY`] = monthly.priceId;
    
    // Create annual price
    const annual = await createStripeProduct(plan, 'annual');
    envVars[`STRIPE_PRICE_ID_${plan.name}_ANNUAL`] = annual.priceId;
  }
  
  // Setup webhook
  const webhookSecret = await setupWebhook();
  if (webhookSecret) {
    envVars.STRIPE_WEBHOOK_SECRET = webhookSecret;
  } else {
    log('\n⚠ Webhook secret not set. You can add it later to .env.local', 'yellow');
  }
  
  // Update .env.local
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('UPDATING ENVIRONMENT', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  updateEnvFile(envVars);
  
  // Success summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  log('✓ SETUP COMPLETE!', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  
  log('\n📋 Summary:', 'bright');
  log(`  • Created ${PLANS.length} products`, 'green');
  log(`  • Created ${PLANS.length * 2} prices (monthly + annual)`, 'green');
  log(`  • Updated .env.local with ${Object.keys(envVars).length} variables`, 'green');
  
  if (webhookSecret) {
    log('  • Configured webhook endpoint', 'green');
  }
  
  log('\n🚀 Next Steps:', 'bright');
  log('  1. Review your products in Stripe Dashboard', 'blue');
  log('  2. Test webhook forwarding: stripe listen --forward-to localhost:3000/api/webhooks/stripe', 'blue');
  log('  3. Start your dev server: npm run dev', 'blue');
  log('  4. Test a subscription with card: 4242 4242 4242 4242', 'blue');
  
  if (!webhookSecret) {
    log('\n⚠ Remember to:', 'yellow');
    log('  • Create webhook in Stripe Dashboard', 'yellow');
    log('  • Add STRIPE_WEBHOOK_SECRET to .env.local', 'yellow');
  }
  
  log('\n📚 Documentation:', 'bright');
  log('  • Setup Guide: STRIPE_SETUP_REQUIRED.md', 'blue');
  log('  • Integration Guide: STRIPE_INTEGRATION_GUIDE.md', 'blue');
  
  rl.close();
}

// Run the script
main().catch((error) => {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'red');
  log('✗ SETUP FAILED', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'red');
  log(`\nError: ${error.message}`, 'red');
  log('\nPlease check the error above and try again.', 'yellow');
  log('For manual setup, see: STRIPE_SETUP_REQUIRED.md', 'blue');
  rl.close();
  process.exit(1);
});
