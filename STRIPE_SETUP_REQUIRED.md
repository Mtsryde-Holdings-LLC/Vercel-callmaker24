# Stripe Integration Setup Requirements

## ✅ What's Already Complete

Your Stripe integration is **fully implemented** with production-ready code:

### Implemented Features
- ✅ **Payment Service** (`src/services/payment.service.ts`) - 350 lines
  - Customer creation with Stripe
  - Subscription management (create, update, cancel)
  - Webhook event processing
  - Credit system (email, SMS, AI credits)
  - Invoice management
  
- ✅ **Webhook Handler** (`src/app/api/webhooks/stripe/route.ts`)
  - Secure signature verification
  - Event processing for all subscription lifecycle events
  - Proper error handling
  
- ✅ **Database Schema** (PostgreSQL)
  - `stripeCustomerId` (unique)
  - `stripeSubscriptionId` (unique)
  - `stripePriceId`
  - `stripeInvoiceId` (unique)
  - All indexes configured
  
- ✅ **Subscription Plans** (`src/config/subscriptions.ts`)
  - 4 tiers: STARTER, ELITE, PRO, ENTERPRISE
  - Monthly and annual billing (15% annual discount)
  - Feature limits per plan
  - 30-day trial periods

### Code Fixes Applied
- ✅ Updated plan mapping from BASIC→STARTER to match actual plans
- ✅ Added ELITE plan support
- ✅ Added annual billing support in payment service
- ✅ Made `userId` unique in Subscription schema
- ✅ Fixed database query patterns

---

## 🔧 What You Need to Configure

### 1. Get Stripe Account Credentials (15 minutes)

#### Test Mode (Development)
1. Create/login to Stripe account: https://dashboard.stripe.com/register
2. Navigate to **Developers → API keys**
3. Copy these keys:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   ```

#### Webhook Secret
1. Navigate to **Developers → Webhooks**
2. Click **"Add endpoint"**
3. Enter webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the **Signing secret**: `whsec_xxxxx`

---

### 2. Create Products and Prices in Stripe (30 minutes)

You need to create **4 products** with **8 prices** (monthly + annual for each):

#### Product 1: STARTER Plan
- **Name**: Starter Plan
- **Monthly Price**: $49.99 USD (recurring monthly)
  - Copy Price ID: `price_xxxxx` → `STRIPE_PRICE_ID_STARTER_MONTHLY`
- **Annual Price**: $509.89 USD (recurring yearly)
  - Copy Price ID: `price_xxxxx` → `STRIPE_PRICE_ID_STARTER_ANNUAL`
- **Features**:
  - 1 agent
  - 500 customers
  - 1,000 email credits/month
  - 500 SMS credits/month
  - 2,000 AI credits/month

#### Product 2: ELITE Plan ⭐ POPULAR
- **Name**: Elite Plan
- **Monthly Price**: $79.99 USD (recurring monthly)
  - Copy Price ID: `price_xxxxx` → `STRIPE_PRICE_ID_ELITE_MONTHLY`
- **Annual Price**: $815.89 USD (recurring yearly)
  - Copy Price ID: `price_xxxxx` → `STRIPE_PRICE_ID_ELITE_ANNUAL`
- **Features**:
  - 3 agents
  - 2,000 customers
  - 5,000 email credits/month
  - 2,000 SMS credits/month
  - 10,000 AI credits/month

#### Product 3: PRO Plan
- **Name**: Pro Plan
- **Monthly Price**: $129.99 USD (recurring monthly)
  - Copy Price ID: `price_xxxxx` → `STRIPE_PRICE_ID_PRO_MONTHLY`
- **Annual Price**: $1,325.89 USD (recurring yearly)
  - Copy Price ID: `price_xxxxx` → `STRIPE_PRICE_ID_PRO_ANNUAL`
- **Features**:
  - 5 agents
  - 10,000 customers
  - 25,000 email credits/month
  - 10,000 SMS credits/month
  - 50,000 AI credits/month

#### Product 4: ENTERPRISE Plan
- **Name**: Enterprise Plan
- **Monthly Price**: $499.99 USD (recurring monthly)
  - Copy Price ID: `price_xxxxx` → `STRIPE_PRICE_ID_ENTERPRISE_MONTHLY`
- **Annual Price**: $5,099.89 USD (recurring yearly)
  - Copy Price ID: `price_xxxxx` → `STRIPE_PRICE_ID_ENTERPRISE_ANNUAL`
- **Features**:
  - 15 agents
  - Unlimited customers
  - 100,000 email credits/month
  - 50,000 SMS credits/month
  - 200,000 AI credits/month

---

### 3. Update Environment Variables

#### Local Development (`.env.local`)
Replace all placeholders with your actual Stripe credentials:

```bash
# Payment Service (Stripe)
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here

# Stripe Price IDs - Monthly Plans
STRIPE_PRICE_ID_STARTER_MONTHLY=price_xxxxx_from_stripe_dashboard
STRIPE_PRICE_ID_ELITE_MONTHLY=price_xxxxx_from_stripe_dashboard
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxxx_from_stripe_dashboard
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_xxxxx_from_stripe_dashboard

# Stripe Price IDs - Annual Plans (15% discount)
STRIPE_PRICE_ID_STARTER_ANNUAL=price_xxxxx_from_stripe_dashboard
STRIPE_PRICE_ID_ELITE_ANNUAL=price_xxxxx_from_stripe_dashboard
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxxxx_from_stripe_dashboard
STRIPE_PRICE_ID_ENTERPRISE_ANNUAL=price_xxxxx_from_stripe_dashboard
```

#### Vercel Production
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add all 11 Stripe variables above
3. Apply to **Production** environment
4. Redeploy your application

---

### 4. Test the Integration (30 minutes)

#### Local Testing with Stripe CLI
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret shown in terminal
5. Update `.env.local` with this secret
6. Restart your dev server

#### Test Subscription Flow
1. Use Stripe test card: `4242 4242 4242 4242`
2. Any future expiry date (e.g., 12/25)
3. Any 3-digit CVC (e.g., 123)
4. Any ZIP code (e.g., 12345)

#### Test Scenarios
- ✅ Create subscription → Check database for new record
- ✅ Verify webhook events received (check terminal logs)
- ✅ Test successful payment → Check credits added
- ✅ Test failed payment → Check status updated to PAST_DUE
- ✅ Cancel subscription → Check cancelAtPeriodEnd flag

---

## 🚀 Production Checklist

Before going live with real payments:

### Switch to Live Mode
1. Navigate to Stripe dashboard → **Live mode** toggle
2. Get new API keys from **Developers → API keys**
3. Create new webhook endpoint for production URL
4. Recreate all 4 products and 8 prices in live mode
5. Update Vercel environment variables with live keys
6. Deploy to production

### Security Best Practices
- ✅ Never commit `.env.local` to git (already in .gitignore)
- ✅ Use environment variables for all secrets
- ✅ Enable webhook signature verification (already implemented)
- ✅ Use HTTPS in production (Vercel does this automatically)
- ✅ Test thoroughly with test cards before accepting real payments

### Compliance
- Set up tax collection if required in your jurisdiction
- Add Terms of Service and Privacy Policy links
- Configure billing email templates
- Set up customer portal for self-service management

---

## 📚 Additional Resources

- **Stripe Integration Guide**: See `STRIPE_INTEGRATION_GUIDE.md` (450+ lines)
- **Test Cards**: https://stripe.com/docs/testing
- **Webhook Events**: https://stripe.com/docs/api/events
- **Customer Portal**: https://stripe.com/docs/billing/subscriptions/customer-portal
- **Stripe CLI**: https://stripe.com/docs/stripe-cli

---

## 🆘 Troubleshooting

### Webhook Not Receiving Events
- Check webhook URL is publicly accessible
- Verify signing secret matches
- Check webhook endpoint is enabled in Stripe dashboard
- Look at webhook logs in Stripe dashboard → Developers → Webhooks

### Payment Failed
- Check Stripe dashboard → Payments for error details
- Verify price IDs match environment variables
- Check customer has valid payment method

### Database Not Updating
- Check application logs for errors
- Verify webhook signature verification passes
- Check database connection is working
- Run `npx prisma generate` if schema changed

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Payment Service Code | ✅ Complete | All methods implemented |
| Webhook Handler | ✅ Complete | Secure signature verification |
| Database Schema | ✅ Complete | All Stripe fields configured |
| Plan Mapping | ✅ Fixed | Now supports all 4 plans + annual |
| Environment Template | ✅ Updated | All 11 variables documented |
| Stripe Account | ⏳ Pending | You need to set up |
| Products & Prices | ⏳ Pending | Create 4 products × 2 prices each |
| Environment Variables | ⏳ Pending | Fill in actual Stripe values |
| Testing | ⏳ Pending | Test with Stripe CLI |
| Production Deployment | ⏳ Pending | Deploy after testing |

---

## Next Steps

1. **NOW**: Create Stripe account → Get test API keys
2. **NEXT**: Create 4 products with 8 prices → Copy price IDs
3. **THEN**: Update `.env.local` with all 11 Stripe values
4. **FINALLY**: Test locally with Stripe CLI → Deploy to production

**Estimated Setup Time**: 1-2 hours total

---

**Need Help?** Check the comprehensive guide in `STRIPE_INTEGRATION_GUIDE.md` for detailed walkthroughs of every step.
