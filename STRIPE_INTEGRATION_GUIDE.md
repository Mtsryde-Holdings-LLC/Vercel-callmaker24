# 💳 Stripe Integration Guide - CallMaker24

## 📊 Current Status: READY FOR CONFIGURATION

Your Stripe integration code is **fully implemented** and tested. You just need to configure it with your Stripe account credentials.

---

## ✅ What's Already Built

### 1. **Payment Service** (`src/services/payment.service.ts`)
- ✅ Create Stripe customers
- ✅ Create subscriptions
- ✅ Cancel subscriptions
- ✅ Handle webhook events
- ✅ Manage invoices
- ✅ Credit system (email/SMS/AI credits)

### 2. **Webhook Handler** (`src/app/api/webhooks/stripe/route.ts`)
- ✅ Signature verification
- ✅ Event processing
- ✅ Error handling

### 3. **Database Schema** (Prisma)
- ✅ `stripeCustomerId` field
- ✅ `stripeSubscriptionId` field
- ✅ `stripePriceId` field
- ✅ `stripeInvoiceId` field
- ✅ Subscription status tracking
- ✅ Invoice records

### 4. **Subscription Plans** (`src/config/subscriptions.ts`)
- ✅ 4 tiers: STARTER, ELITE, PRO, ENTERPRISE
- ✅ Monthly & Annual pricing
- ✅ Feature limits per plan
- ✅ 30-day free trial for all plans

---

## 🔧 Configuration Needed

### Step 1: Create/Access Stripe Account

1. **Go to**: https://stripe.com
2. **Sign up** or **Log in**
3. **Choose**: Start with **Test Mode** (recommended)

### Step 2: Get API Keys

1. Go to **Developers** → **API keys**
2. Copy your keys:
   - **Publishable key**: Starts with `pk_test_...` (Test) or `pk_live_...` (Live)
   - **Secret key**: Starts with `sk_test_...` (Test) or `sk_live_...` (Live)

### Step 3: Create Products & Prices

You need to create **4 products** in Stripe (one for each plan):

#### 🏁 1. Starter Plan

**Monthly:**
- Go to **Products** → **Add Product**
- Name: `CallMaker24 - Starter Monthly`
- Price: `$49.99`
- Billing: `Recurring - Monthly`
- Copy the **Price ID** (starts with `price_...`)

**Annual:**
- Same product, add another price
- Name: `CallMaker24 - Starter Annual`
- Price: `$509.89` (= $49.99 × 12 × 0.85)
- Billing: `Recurring - Yearly`
- Copy the **Price ID**

#### ⭐ 2. Elite Plan (Popular)

**Monthly:**
- Name: `CallMaker24 - Elite Monthly`
- Price: `$79.99`
- Billing: `Recurring - Monthly`
- Copy **Price ID**

**Annual:**
- Name: `CallMaker24 - Elite Annual`
- Price: `$815.89` (= $79.99 × 12 × 0.85)
- Billing: `Recurring - Yearly`
- Copy **Price ID**

#### 💼 3. Professional Plan

**Monthly:**
- Name: `CallMaker24 - Pro Monthly`
- Price: `$129.99`
- Billing: `Recurring - Monthly`
- Copy **Price ID**

**Annual:**
- Name: `CallMaker24 - Pro Annual`
- Price: `$1,325.89` (= $129.99 × 12 × 0.85)
- Billing: `Recurring - Yearly`
- Copy **Price ID**

#### 🏢 4. Enterprise Plan

**Monthly:**
- Name: `CallMaker24 - Enterprise Monthly`
- Price: `$499.99`
- Billing: `Recurring - Monthly`
- Copy **Price ID**

**Annual:**
- Name: `CallMaker24 - Enterprise Annual`
- Price: `$5,099.89` (= $499.99 × 12 × 0.85)
- Billing: `Recurring - Yearly`
- Copy **Price ID**

### Step 4: Set Up Webhook

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: 
   - **Test**: `http://localhost:3000/api/webhooks/stripe` (for local testing)
   - **Production**: `https://your-domain.vercel.app/api/webhooks/stripe`
3. **Events to listen to**:
   ```
   ✓ customer.subscription.created
   ✓ customer.subscription.updated
   ✓ customer.subscription.deleted
   ✓ invoice.paid
   ✓ invoice.payment_failed
   ✓ checkout.session.completed
   ```
4. Click **Add endpoint**
5. Copy the **Signing secret** (starts with `whsec_...`)

### Step 5: Update Environment Variables

Update your `.env.local` file (or Vercel environment variables):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here

# Stripe Price IDs - MONTHLY
STRIPE_PRICE_ID_STARTER_MONTHLY=price_xxxxx_from_stripe
STRIPE_PRICE_ID_ELITE_MONTHLY=price_xxxxx_from_stripe
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxxx_from_stripe
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_xxxxx_from_stripe

# Stripe Price IDs - ANNUAL
STRIPE_PRICE_ID_STARTER_ANNUAL=price_xxxxx_from_stripe
STRIPE_PRICE_ID_ELITE_ANNUAL=price_xxxxx_from_stripe
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxxxx_from_stripe
STRIPE_PRICE_ID_ENTERPRISE_ANNUAL=price_xxxxx_from_stripe
```

**⚠️ Important Notes:**
- Never commit real API keys to Git
- Use **Test mode** keys for development
- Use **Live mode** keys only in production
- Add these to **Vercel Environment Variables** for production

---

## 🧪 Testing the Integration

### 1. Test Local Webhook (Development)

Install Stripe CLI:
```bash
# Windows (using Scoop)
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

Forward webhooks to local:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook secret starting with `whsec_...` - add this to your `.env.local`.

### 2. Test Subscription Creation

Use Stripe's test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

**Expiry**: Any future date  
**CVC**: Any 3 digits  
**ZIP**: Any 5 digits

### 3. Test Webhook Events

After setting up `stripe listen`, trigger test events:

```bash
# Test subscription created
stripe trigger customer.subscription.created

# Test invoice paid
stripe trigger invoice.payment_succeeded

# Test subscription cancelled
stripe trigger customer.subscription.deleted
```

Check your terminal logs to see webhook processing.

---

## 📋 Configuration Checklist

Before going live, verify:

### Development (Test Mode)
- [ ] Stripe test account created
- [ ] Test API keys added to `.env.local`
- [ ] 8 test products/prices created (4 monthly + 4 annual)
- [ ] All 8 price IDs added to environment variables
- [ ] Webhook endpoint added with test signing secret
- [ ] Stripe CLI installed and forwarding webhooks
- [ ] Test subscription flows work
- [ ] Webhook events process correctly
- [ ] Database records created properly

### Production (Live Mode)
- [ ] Stripe account fully activated (business info, banking)
- [ ] Live API keys obtained
- [ ] 8 production products/prices created
- [ ] All 8 price IDs added to Vercel environment variables
- [ ] Production webhook endpoint configured
- [ ] Webhook signing secret added to Vercel
- [ ] SSL certificate active on domain
- [ ] Test real payment flows
- [ ] Customer portal enabled in Stripe
- [ ] Email receipts configured
- [ ] Tax settings configured (if applicable)
- [ ] Compliance requirements met (terms, privacy policy)

---

## 🔐 Security Best Practices

### 1. **API Key Management**
- ✅ Never commit keys to Git
- ✅ Use environment variables only
- ✅ Rotate keys periodically
- ✅ Use restricted API keys when possible

### 2. **Webhook Security**
- ✅ Always verify webhook signatures
- ✅ Use HTTPS in production
- ✅ Log all webhook events
- ✅ Handle idempotency (duplicate events)

### 3. **Payment Security**
- ✅ Never store card numbers
- ✅ Use Stripe.js for PCI compliance
- ✅ Implement 3D Secure for high-value transactions
- ✅ Monitor for fraud

---

## 🔄 How It Works

### Subscription Creation Flow

```mermaid
User → Frontend → Create Subscription API
                 ↓
          PaymentService.createSubscription()
                 ↓
          Stripe API → Create Customer
                 ↓
          Stripe API → Attach Payment Method
                 ↓
          Stripe API → Create Subscription
                 ↓
          Database → Save Subscription Record
                 ↓
          Frontend ← Return Client Secret
                 ↓
          User confirms payment
                 ↓
Stripe Webhook → /api/webhooks/stripe
                 ↓
          PaymentService.handleWebhook()
                 ↓
          Database → Update Subscription Status
```

### Events Your System Handles

1. **`customer.subscription.created`**
   - New subscription activated
   - Updates database with subscription details
   - Grants access to platform features

2. **`customer.subscription.updated`**
   - Plan upgrade/downgrade
   - Updates feature limits
   - Adjusts billing cycle

3. **`customer.subscription.deleted`**
   - Subscription cancelled
   - Revokes platform access
   - Marks as CANCELLED in database

4. **`invoice.paid`**
   - Successful payment
   - Creates invoice record
   - Extends subscription period
   - Sends receipt email

5. **`invoice.payment_failed`**
   - Payment declined
   - Marks subscription as PAST_DUE
   - Triggers retry logic
   - Sends notification email

---

## 📊 Subscription Plans Mapping

Your code maps Stripe Price IDs to plan tiers:

| Plan | Monthly Price | Annual Price | Price ID Variable |
|------|---------------|--------------|-------------------|
| **Starter** | $49.99/mo | $509.89/yr | `STRIPE_PRICE_ID_STARTER_MONTHLY` / `_ANNUAL` |
| **Elite** | $79.99/mo | $815.89/yr | `STRIPE_PRICE_ID_ELITE_MONTHLY` / `_ANNUAL` |
| **Pro** | $129.99/mo | $1,325.89/yr | `STRIPE_PRICE_ID_PRO_MONTHLY` / `_ANNUAL` |
| **Enterprise** | $499.99/mo | $5,099.89/yr | `STRIPE_PRICE_ID_ENTERPRISE_MONTHLY` / `_ANNUAL` |

**Annual Savings:** 15% discount (2 months free)

---

## 🛠️ Troubleshooting

### Issue: "Invalid API Key"
**Solution**: 
- Check if you're using test key in test mode
- Verify no extra spaces in `.env.local`
- Restart Next.js server after adding keys

### Issue: "Webhook signature verification failed"
**Solution**:
- Ensure webhook secret matches Stripe dashboard
- Check timestamp tolerance (5 minutes)
- Verify request body is raw (not parsed)

### Issue: "Price not found"
**Solution**:
- Verify Price ID exists in Stripe
- Check if using test vs live price IDs
- Ensure price is active in Stripe dashboard

### Issue: "Customer already exists"
**Solution**:
- Code handles this - checks for existing customer
- Database stores `stripeCustomerId` to prevent duplicates

---

## 📞 Stripe Support Resources

- **Documentation**: https://stripe.com/docs
- **API Reference**: https://stripe.com/docs/api
- **Support**: https://support.stripe.com
- **Status**: https://status.stripe.com
- **Community**: https://discord.gg/stripe

---

## 🎯 Next Steps

### Immediate (Development):
1. ✅ Create Stripe test account
2. ✅ Get test API keys
3. ✅ Create 8 test products/prices
4. ✅ Add all keys to `.env.local`
5. ✅ Test subscription flow locally
6. ✅ Test webhook events with Stripe CLI

### Before Production:
1. ⏳ Activate Stripe account (business verification)
2. ⏳ Create live products/prices
3. ⏳ Configure production webhook
4. ⏳ Add live keys to Vercel
5. ⏳ Test with real payments (small amounts)
6. ⏳ Enable customer portal
7. ⏳ Set up email notifications
8. ⏳ Configure tax settings

### Post-Launch:
1. 📊 Monitor Stripe dashboard daily
2. 📧 Set up fraud alerts
3. 💰 Track MRR (Monthly Recurring Revenue)
4. 🔄 Review failed payment retry logic
5. 📈 Analyze churn metrics

---

## 💡 Pro Tips

1. **Use Test Clock** in Stripe to test subscription renewals without waiting
2. **Enable Customer Portal** to let users manage their own subscriptions
3. **Set up Radar** for fraud prevention
4. **Use Stripe Tax** for automatic tax calculations
5. **Monitor webhook logs** in Stripe dashboard for debugging
6. **Set up billing alerts** to get notified of important events
7. **Use metadata** to store additional info with customers/subscriptions

---

## 📝 Summary

✅ **Your Stripe integration is 100% code-complete**  
⏳ **You just need to configure it with your credentials**  
🚀 **Follow the steps above to go live**

**Estimated Setup Time:** 30-60 minutes

**Need Help?** Check Stripe's documentation or reach out to their excellent support team.

---

*Last Updated: November 18, 2025*
