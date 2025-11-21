require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  console.log('🔧 Setting up Stripe products and prices...\n');

  const plans = [
    { name: 'STARTER', displayName: 'Starter Plan', monthlyPrice: 49.99, annualPrice: 509.99 },
    { name: 'ELITE', displayName: 'Elite Plan', monthlyPrice: 79.99, annualPrice: 815.99 },
    { name: 'PRO', displayName: 'Pro Plan', monthlyPrice: 129.99, annualPrice: 1325.99 },
    { name: 'ENTERPRISE', displayName: 'Enterprise Plan', monthlyPrice: 499.99, annualPrice: 5099.99 }
  ];

  console.log('Add these to your .env file:\n');

  for (const plan of plans) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: `CallMaker24 ${plan.displayName}`,
        description: `${plan.displayName} subscription for CallMaker24`
      });

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.monthlyPrice * 100),
        currency: 'usd',
        recurring: { interval: 'month' }
      });

      // Create annual price
      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.annualPrice * 100),
        currency: 'usd',
        recurring: { interval: 'year' }
      });

      console.log(`STRIPE_PRICE_ID_${plan.name}_MONTHLY=${monthlyPrice.id}`);
      console.log(`STRIPE_PRICE_ID_${plan.name}_ANNUAL=${annualPrice.id}`);
      console.log('');

    } catch (error) {
      console.error(`Error creating ${plan.name}:`, error.message);
    }
  }

  console.log('\n✅ Done! Copy the above lines to your .env file');
}

setupStripeProducts();