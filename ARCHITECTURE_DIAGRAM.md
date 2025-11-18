# Stripe Integration - Architecture Flow

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────────┘

1. SUBSCRIPTION FLOW
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Browse  │───▶│  Select  │───▶│   Pay    │───▶│  Success │
│  Plans   │    │   Plan   │    │ @ Stripe │    │ Message  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │                │               │
     │               │                │               │
     ▼               ▼                ▼               ▼
Settings Page   Click Subscribe   Checkout Page   Redirected Back


2. MANAGEMENT FLOW
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  View    │───▶│  Manage  │───▶│  Update  │───▶│  Return  │
│  Billing │    │  Button  │    │ @ Portal │    │   Back   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘


3. CANCELLATION FLOW
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Active  │───▶│  Cancel  │───▶│  Confirm │───▶│  Retain  │
│   Sub    │    │  Button  │    │  Dialog  │    │  Access  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                  (until period end)
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Client Side)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Settings Page (src/app/dashboard/settings/page.tsx)                │
│       │                                                              │
│       └──▶ BillingTab Component                                     │
│            (src/components/billing/BillingTab.tsx)                  │
│                                                                      │
│            ┌─────────────────────────────────────┐                  │
│            │  • Display pricing plans            │                  │
│            │  • Show usage statistics            │                  │
│            │  • Subscribe buttons                │                  │
│            │  • Manage subscription button       │                  │
│            │  • Cancel subscription button       │                  │
│            │  • Invoice history table            │                  │
│            └─────────────────────────────────────┘                  │
│                      │                                               │
└──────────────────────┼───────────────────────────────────────────────┘
                       │
                       │ HTTP Requests
                       │
┌──────────────────────▼───────────────────────────────────────────────┐
│                     API LAYER (Server Side)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Authentication Layer (NextAuth)                                    │
│       │                                                              │
│       └──▶ Subscription Endpoints                                   │
│                                                                      │
│            ┌─────────────────────────────────────┐                  │
│            │  POST /api/subscriptions/           │                  │
│            │      create-checkout                │                  │
│            │  • Validate session                 │                  │
│            │  • Create Stripe customer           │                  │
│            │  • Create checkout session          │                  │
│            └─────────────────────────────────────┘                  │
│                                                                      │
│            ┌─────────────────────────────────────┐                  │
│            │  GET /api/subscriptions/current     │                  │
│            │  • Validate session                 │                  │
│            │  • Fetch subscription from DB       │                  │
│            │  • Return usage stats               │                  │
│            └─────────────────────────────────────┘                  │
│                                                                      │
│            ┌─────────────────────────────────────┐                  │
│            │  POST /api/subscriptions/cancel     │                  │
│            │  • Validate session                 │                  │
│            │  • Cancel via Stripe API            │                  │
│            │  • Update database                  │                  │
│            └─────────────────────────────────────┘                  │
│                                                                      │
│            ┌─────────────────────────────────────┐                  │
│            │  POST /api/subscriptions/portal     │                  │
│            │  • Validate session                 │                  │
│            │  • Create portal session            │                  │
│            │  • Return portal URL                │                  │
│            └─────────────────────────────────────┘                  │
│                      │                                               │
└──────────────────────┼───────────────────────────────────────────────┘
                       │
                       │ Calls
                       │
┌──────────────────────▼───────────────────────────────────────────────┐
│                  SERVICE LAYER (Business Logic)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PaymentService (src/services/payment.service.ts)                   │
│                                                                      │
│            ┌─────────────────────────────────────┐                  │
│            │  • handleWebhook()                  │                  │
│            │    - checkout.session.completed     │                  │
│            │    - subscription.created           │                  │
│            │    - subscription.updated           │                  │
│            │    - subscription.deleted           │                  │
│            │    - invoice.paid                   │                  │
│            │    - invoice.payment_failed         │                  │
│            │                                     │                  │
│            │  • createSubscription()             │                  │
│            │  • cancelSubscription()             │                  │
│            │  • addCredits()                     │                  │
│            │  • deductCredits()                  │                  │
│            │  • getCreditsForPlan()              │                  │
│            └─────────────────────────────────────┘                  │
│                      │                                               │
└──────────────────────┼───────────────────────────────────────────────┘
                       │
                       │ Database Operations
                       │
┌──────────────────────▼───────────────────────────────────────────────┐
│                   DATABASE LAYER (Prisma ORM)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PostgreSQL Database                                                │
│                                                                      │
│            ┌─────────────────────────────────────┐                  │
│            │  Subscription Model                 │                  │
│            │  • id (unique)                      │                  │
│            │  • userId (unique) ←── NEW          │                  │
│            │  • plan                             │                  │
│            │  • status                           │                  │
│            │  • stripeCustomerId                 │                  │
│            │  • stripeSubscriptionId             │                  │
│            │  • emailCredits / smsCredits        │                  │
│            │  • aiCredits                        │                  │
│            │  • emailUsed / smsUsed / aiUsed     │                  │
│            │  • currentPeriodStart/End           │                  │
│            │  • invoices (relation)              │                  │
│            └─────────────────────────────────────┘                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Stripe API                                                          │
│            ┌─────────────────────────────────────┐                  │
│            │  • Checkout Session API             │                  │
│            │  • Subscription API                 │                  │
│            │  • Customer Portal API              │                  │
│            │  • Webhook Events                   │                  │
│            └─────────────────────────────────────┘                  │
│                      │                                               │
│                      │ Webhooks                                      │
│                      ▼                                               │
│            POST /api/webhooks/stripe                                │
│            • Signature verification                                 │
│            • Event routing                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow - Subscribe to Plan

```
1. User clicks "Subscribe" on Pro Plan
        ↓
2. BillingTab calls POST /api/subscriptions/create-checkout
        ↓
3. API validates session & priceId
        ↓
4. API creates/retrieves Stripe customer
        ↓
5. API creates Stripe Checkout session
        ↓
6. User redirected to Stripe Checkout page
        ↓
7. User enters payment details
        ↓
8. Stripe processes payment
        ↓
9. Stripe sends checkout.session.completed webhook
        ↓
10. PaymentService.handleCheckoutCompleted()
        ↓
11. Fetch full subscription from Stripe
        ↓
12. Upsert subscription in database
        ↓
13. Allocate credits based on plan
        ↓
14. User redirected back with success message
        ↓
15. BillingTab refreshes and shows active subscription
```

## Credit Allocation Logic

```
Plan           Email      SMS       AI
FREE           100        10        5
STARTER        5,000      500       100
ELITE          25,000     2,500     500
PROFESSIONAL   50,000     5,000     1,000
ENTERPRISE     500,000    50,000    10,000

Credits reset at each billing period
Usage tracked in real-time
Deducted when sending email/SMS or using AI
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYERS                                │
└─────────────────────────────────────────────────────────────────────┘

1. HTTPS Layer
   └── All communication encrypted

2. Authentication Layer (NextAuth)
   └── Session validation on all endpoints

3. Authorization Layer
   └── User can only access own data

4. Webhook Verification Layer
   └── Signature verification via Stripe SDK

5. Input Validation Layer
   └── Validate priceId, subscription existence

6. Database Layer (Prisma ORM)
   └── SQL injection prevention

7. Error Handling Layer
   └── Generic messages, detailed logging
```

## Environment Configuration

```
Development                Production
┌─────────────┐           ┌─────────────┐
│ Test Keys   │           │ Live Keys   │
│ sk_test_... │           │ sk_live_... │
│ pk_test_... │           │ pk_live_... │
└─────────────┘           └─────────────┘
       │                         │
       ├─────────────────────────┤
       │                         │
       ▼                         ▼
┌──────────────────────────────────────┐
│     Environment Variables (.env)      │
├──────────────────────────────────────┤
│ STRIPE_SECRET_KEY                    │
│ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   │
│ STRIPE_WEBHOOK_SECRET                │
│ STRIPE_PRICE_ID_BASIC                │
│ STRIPE_PRICE_ID_PRO                  │
│ STRIPE_PRICE_ID_ENTERPRISE           │
└──────────────────────────────────────┘
```

## Component Hierarchy

```
Settings Page
    └── Tab Navigation
        └── Billing Tab
            ├── Message Banner (success/error)
            ├── Current Subscription Card (if active)
            │   ├── Plan Name & Status
            │   ├── Usage Statistics (3 cards)
            │   └── Action Buttons
            │       ├── Manage Subscription
            │       └── Cancel Subscription
            ├── Pricing Plans Grid
            │   ├── Basic Plan Card
            │   │   ├── Price
            │   │   ├── Features List
            │   │   └── Subscribe Button
            │   ├── Pro Plan Card (Popular)
            │   │   ├── Price
            │   │   ├── Features List
            │   │   └── Subscribe Button
            │   └── Enterprise Plan Card
            │       ├── Price
            │       ├── Features List
            │       └── Subscribe Button
            └── Invoice History Table (if invoices exist)
                └── Invoice Rows
                    ├── Date
                    ├── Amount
                    ├── Status Badge
                    └── View Link
```

## Webhook Event Flow

```
Stripe Event                           Application Handler
────────────────────────────────────────────────────────────────

checkout.session.completed     ──▶    handleCheckoutCompleted()
                                      └── Create/Update subscription
                                      └── Allocate credits

customer.subscription.created  ──▶    handleSubscriptionUpdate()
customer.subscription.updated         └── Update subscription details

customer.subscription.deleted  ──▶    handleSubscriptionDeleted()
                                      └── Mark as CANCELLED

invoice.paid                  ──▶    handleInvoicePaid()
                                      └── Create invoice record

invoice.payment_failed        ──▶    handleInvoicePaymentFailed()
                                      └── Set status to PAST_DUE
```

---

This diagram provides a complete visual overview of the Stripe integration architecture, data flows, and component relationships.
