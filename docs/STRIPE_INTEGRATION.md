# Stripe Integration Guide

## Overview

This application includes a complete Stripe integration for managing subscriptions, payments, and billing. Users can subscribe to different plans, manage their subscriptions, view invoices, and track usage credits.

## Features

### 1. Subscription Plans

The application supports three subscription tiers:

- **Basic Plan** ($29/month)
  - 5,000 emails/month
  - 500 SMS messages/month
  - 100 AI credits/month
  - Basic analytics
  - Email support

- **Pro Plan** ($99/month) - Most Popular
  - 50,000 emails/month
  - 5,000 SMS messages/month
  - 1,000 AI credits/month
  - Advanced analytics
  - Priority support
  - Custom templates

- **Enterprise Plan** ($299/month)
  - 500,000 emails/month
  - 50,000 SMS messages/month
  - 10,000 AI credits/month
  - Advanced analytics
  - Dedicated support
  - Custom integrations
  - White-label options

### 2. API Endpoints

#### Create Checkout Session
```
POST /api/subscriptions/create-checkout
```
Creates a Stripe Checkout session for subscribing to a plan.

**Request Body:**
```json
{
  "priceId": "price_xxxxx"
}
```

**Response:**
```json
{
  "sessionId": "cs_xxxxx",
  "url": "https://checkout.stripe.com/..."
}
```

#### Get Current Subscription
```
GET /api/subscriptions/current
```
Retrieves the user's current subscription details and usage stats.

**Response:**
```json
{
  "id": "sub_xxxxx",
  "plan": "PRO",
  "status": "ACTIVE",
  "currentPeriodEnd": "2025-12-18T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "emailCredits": 50000,
  "smsCredits": 5000,
  "aiCredits": 1000,
  "emailUsed": 1250,
  "smsUsed": 150,
  "aiUsed": 45,
  "invoices": [...]
}
```

#### Cancel Subscription
```
POST /api/subscriptions/cancel
```
Cancels the user's subscription.

**Request Body:**
```json
{
  "immediately": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription will be cancelled at period end"
}
```

#### Customer Portal
```
POST /api/subscriptions/portal
```
Creates a Stripe Customer Portal session for managing subscription and payment methods.

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### 3. Webhooks

The application listens for Stripe webhooks at `/api/webhooks/stripe` to handle:

- `checkout.session.completed` - New subscription created
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription updated (plan change, renewal, etc.)
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.paid` - Invoice paid successfully
- `invoice.payment_failed` - Payment failed

### 4. Frontend Components

#### BillingTab Component
Location: `src/components/billing/BillingTab.tsx`

The main billing component displays:
- Current subscription details
- Usage statistics (email, SMS, AI credits)
- Pricing plans with subscribe buttons
- Invoice history
- Subscription management (cancel, manage)

## Setup Instructions

### 1. Create Stripe Account
1. Sign up at [https://stripe.com](https://stripe.com)
2. Get your API keys from the Dashboard

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs (create products in Stripe Dashboard)
STRIPE_PRICE_ID_BASIC=price_xxxxx
STRIPE_PRICE_ID_PRO=price_xxxxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxxxx
```

### 3. Create Products in Stripe

1. Go to Stripe Dashboard → Products
2. Create three products:
   - Basic Plan ($29/month)
   - Pro Plan ($99/month)
   - Enterprise Plan ($299/month)
3. Copy the Price IDs and add them to your `.env` file

### 4. Set Up Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the Webhook signing secret and add to `.env` as `STRIPE_WEBHOOK_SECRET`

### 5. Configure Stripe Customer Portal

1. Go to Stripe Dashboard → Settings → Billing → Customer portal
2. Enable the customer portal
3. Configure which features customers can access:
   - Update payment method
   - View invoices
   - Cancel subscription

### 6. Update Database Schema

Run Prisma migrations to update the database:

```bash
npx prisma generate
npx prisma db push
```

Note: The `userId` field in the Subscription model is now marked as unique to ensure one subscription per user.

## Usage Flow

### Subscribing to a Plan

1. User navigates to Settings → Billing tab
2. User selects a plan and clicks "Subscribe"
3. User is redirected to Stripe Checkout
4. After successful payment, user is redirected back with success message
5. Webhook handler updates the database with subscription details
6. User's credits are allocated based on the plan

### Managing Subscription

1. User clicks "Manage Subscription" button
2. User is redirected to Stripe Customer Portal
3. User can update payment method, view invoices, or cancel subscription
4. Changes are synced back via webhooks

### Canceling Subscription

1. User clicks "Cancel Subscription" button
2. Confirmation dialog appears
3. Subscription is set to cancel at period end
4. User retains access until the end of billing period

## Credit System

Credits are automatically allocated when a user subscribes:

- **Email Credits**: Number of emails user can send
- **SMS Credits**: Number of SMS messages user can send
- **AI Credits**: Number of AI API calls user can make

Credits are reset at the start of each billing period. Usage is tracked and deducted as the user consumes resources.

## Testing

### Test Mode
Use Stripe test mode for development:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

### Webhook Testing
Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

## Security Considerations

1. **Webhook Verification**: All webhook events are verified using the Stripe signature
2. **Authentication**: All API endpoints require NextAuth session
3. **Authorization**: Users can only access their own subscription data
4. **HTTPS**: Always use HTTPS in production
5. **Environment Variables**: Never commit API keys to version control

## Troubleshooting

### Webhook Events Not Received
- Check webhook endpoint URL is correct
- Verify webhook secret is set correctly
- Check webhook event types are selected in Stripe Dashboard
- Review webhook logs in Stripe Dashboard

### Subscription Not Created
- Check Stripe API keys are correct
- Verify Price IDs match your Stripe products
- Check database connection
- Review server logs for errors

### Credits Not Allocated
- Verify webhook handler is running
- Check `getCreditsForPlan` method returns correct values
- Review database for subscription record

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Testing Stripe](https://stripe.com/docs/testing)

## Support

For issues related to Stripe integration, please check:
1. Server logs for API errors
2. Stripe Dashboard → Developers → Logs
3. Webhook delivery logs
4. Database subscription records
