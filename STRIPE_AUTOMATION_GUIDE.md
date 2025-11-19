# Stripe Automation Guide

This guide shows you how to automatically set up your Stripe integration using the provided scripts and VS Code Stripe extension.

## 🚀 Quick Start (5 Minutes)

### Method 1: Using Automation Script (Recommended)

1. **Install Stripe CLI** (if not already installed):
   ```powershell
   # Windows (using Scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```powershell
   stripe login
   ```
   This opens your browser to authenticate.

3. **Run the automation script**:
   ```powershell
   node scripts/setup-stripe.js
   ```

4. **Follow the prompts**:
   - Script will retrieve your API keys
   - Create all 4 products automatically
   - Create 8 prices (monthly + annual for each)
   - Update your `.env.local` file
   - Optionally create webhook endpoint

**That's it!** Your Stripe integration is configured in ~5 minutes.

---

### Method 2: Using VS Code Stripe Extension

The Stripe extension is already installed in your VS Code.

#### Step 1: Login to Stripe Extension

1. Open Command Palette: `Ctrl+Shift+P`
2. Type: `Stripe: Login`
3. Select your Stripe account
4. Authenticate in browser

#### Step 2: Create Products

For each plan (STARTER, ELITE, PRO, ENTERPRISE):

1. `Ctrl+Shift+P` → `Stripe: Create Product`
2. Fill in the product details:
   - **Name**: "Starter Plan" (or Elite, Pro, Enterprise)
   - **Description**: Plan description
3. Create monthly price:
   - **Amount**: See pricing below
   - **Currency**: USD
   - **Recurring**: Monthly
4. Copy the price ID
5. Repeat for annual price (with 15% discount)

**Pricing Reference**:
- **STARTER**: $49.99/mo, $509.89/yr
- **ELITE**: $79.99/mo, $815.89/yr
- **PRO**: $129.99/mo, $1,325.89/yr
- **ENTERPRISE**: $499.99/mo, $5,099.89/yr

#### Step 3: Setup Webhook Forwarding

1. `Ctrl+Shift+P` → `Stripe: Start webhook forwarding`
2. Endpoint: `http://localhost:3000/api/webhooks/stripe`
3. Copy the webhook signing secret shown
4. Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`

#### Step 4: Add Environment Variables

Manually add all price IDs to `.env.local`:
```bash
STRIPE_PRICE_ID_STARTER_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_STARTER_ANNUAL=price_xxxxx
STRIPE_PRICE_ID_ELITE_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_ELITE_ANNUAL=price_xxxxx
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxxxx
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_ENTERPRISE_ANNUAL=price_xxxxx
```

---

## 🧪 Testing Your Integration

### Test Webhook Events

Use the provided testing script:

```powershell
node scripts/test-stripe-webhooks.js
```

**Options**:
1. Start webhook forwarding (listens for all events)
2. Test specific webhook event
3. Test all webhook events sequentially
4. Exit

### Manual Testing

1. **Start dev server**:
   ```powershell
   npm run dev
   ```

2. **In another terminal, forward webhooks**:
   ```powershell
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

3. **Test subscription creation**:
   - Navigate to your app's subscription page
   - Use test card: `4242 4242 4242 4242`
   - Any future date, any CVC, any ZIP
   - Complete checkout

4. **Verify in terminal**:
   - Check webhook forwarding terminal for events
   - Check dev server logs for processing
   - Check database for new subscription record

### Test Different Scenarios

```powershell
# Test successful subscription
stripe trigger customer.subscription.created

# Test subscription update
stripe trigger customer.subscription.updated

# Test successful payment
stripe trigger invoice.paid

# Test failed payment
stripe trigger invoice.payment_failed

# Test subscription cancellation
stripe trigger customer.subscription.deleted
```

---

## 📋 Script Reference

### setup-stripe.js

**Purpose**: Automates complete Stripe setup

**What it does**:
- ✅ Checks Stripe CLI installation
- ✅ Verifies authentication
- ✅ Retrieves API keys
- ✅ Creates 4 products
- ✅ Creates 8 prices (monthly + annual)
- ✅ Updates `.env.local` automatically
- ✅ Optionally creates webhook endpoint

**Usage**:
```powershell
node scripts/setup-stripe.js
```

**Output**:
- All products and prices created in Stripe
- `.env.local` updated with all 11 required variables
- Summary of created resources

### test-stripe-webhooks.js

**Purpose**: Test webhook integration locally

**Features**:
- Start webhook forwarding to localhost
- Trigger individual webhook events
- Test all events sequentially
- Interactive menu

**Usage**:
```powershell
node scripts/test-stripe-webhooks.js
```

---

## 🔧 Troubleshooting

### Stripe CLI Not Found

**Error**: `stripe: command not found`

**Solution**:
```powershell
# Windows
scoop install stripe

# Or download installer from:
# https://github.com/stripe/stripe-cli/releases/latest
```

### Not Authenticated

**Error**: `No API key configured`

**Solution**:
```powershell
stripe login
```

### Webhook Not Receiving Events

**Check**:
1. Dev server is running on port 3000
2. Webhook forwarding is active: `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
3. Webhook secret in `.env.local` matches forwarding terminal
4. Restart dev server after updating `.env.local`

### Product Creation Fails

**Common Issues**:
- Not logged into Stripe CLI
- Network connection issues
- Invalid price amounts (must be in cents)

**Solution**:
```powershell
# Re-authenticate
stripe login

# Check connection
stripe customers list --limit 1

# Try again
node scripts/setup-stripe.js
```

### Environment Variables Not Loading

**Solution**:
1. Verify `.env.local` exists in project root
2. Restart dev server after changes
3. Check for syntax errors (no quotes around values unless they contain spaces)

---

## 🌐 Production Deployment

### Switch to Live Mode

1. **Get Live API Keys**:
   - Stripe Dashboard → Switch to "Live mode"
   - Developers → API keys
   - Copy live keys

2. **Create Live Products**:
   ```powershell
   # Login with live mode
   stripe login --live
   
   # Run setup script in live mode
   node scripts/setup-stripe.js
   ```

3. **Create Live Webhook**:
   - Stripe Dashboard (Live mode)
   - Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select same events as test mode
   - Copy signing secret

4. **Update Vercel Environment Variables**:
   - Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all 11 Stripe variables with **live** values
   - Set environment: **Production**
   - Redeploy

5. **Test Live Mode**:
   - Use real card (start with small amount)
   - Verify subscription created
   - Check webhook events received
   - Verify database updated

---

## 📊 VS Code Stripe Extension Features

### Available Commands (Ctrl+Shift+P)

| Command | Description |
|---------|-------------|
| `Stripe: Login` | Authenticate with Stripe account |
| `Stripe: Create Product` | Create new product in Stripe |
| `Stripe: Create Price` | Add price to existing product |
| `Stripe: Start webhook forwarding` | Forward webhooks to localhost |
| `Stripe: Trigger webhook event` | Simulate webhook event |
| `Stripe: Open Dashboard` | Open Stripe Dashboard in VS Code |
| `Stripe: View logs` | View Stripe API logs |

### Stripe Extension Panel

Access from Activity Bar (left side):
- View recent events
- Browse products & prices
- Monitor webhook deliveries
- Check customer list
- View payment intents

---

## 🎯 Next Steps After Setup

1. **Start Development**:
   ```powershell
   npm run dev
   ```

2. **Forward Webhooks**:
   ```powershell
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

3. **Test Subscription Flow**:
   - Visit `/pricing` or subscription page
   - Select a plan
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - Verify in database

4. **Monitor Events**:
   - Watch webhook forwarding terminal
   - Check Stripe extension panel
   - View application logs

5. **Review Documentation**:
   - `STRIPE_SETUP_REQUIRED.md` - Setup requirements
   - `STRIPE_INTEGRATION_GUIDE.md` - Detailed integration guide
   - This file - Automation guide

---

## 📚 Additional Resources

- **Stripe CLI Docs**: https://stripe.com/docs/stripe-cli
- **VS Code Extension**: https://marketplace.visualstudio.com/items?itemName=stripe.vscode-stripe
- **Testing**: https://stripe.com/docs/testing
- **Webhooks**: https://stripe.com/docs/webhooks
- **Products & Prices**: https://stripe.com/docs/products-prices/overview

---

## ✅ Setup Verification Checklist

After running the automation script, verify:

- [ ] Stripe CLI installed and authenticated
- [ ] 4 products created in Stripe Dashboard
- [ ] 8 prices created (monthly + annual for each)
- [ ] `.env.local` has all 11 Stripe variables
- [ ] Webhook endpoint created (or can forward locally)
- [ ] Dev server starts without errors
- [ ] Can create test subscription
- [ ] Webhooks received and processed
- [ ] Database records created correctly
- [ ] Credits added to subscription

**All checked?** Your Stripe integration is ready! 🎉

---

## 💡 Pro Tips

1. **Use Stripe Extension** for quick access to Dashboard
2. **Keep webhook forwarding running** during development
3. **Check webhook logs** if events aren't processing
4. **Test all scenarios** before going live
5. **Use test mode** until fully tested
6. **Monitor Stripe logs** in extension panel
7. **Set up alerts** for failed payments in production

---

Need help? Check the comprehensive `STRIPE_INTEGRATION_GUIDE.md` for detailed explanations of every component.
