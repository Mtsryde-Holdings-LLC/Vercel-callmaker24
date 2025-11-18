# Subscription-Based Signup Flow ✅

## Overview
CallMaker24 now has a complete subscription-based signup flow where users can:
1. Choose a subscription plan
2. Create their organization automatically
3. Get CORPORATE_ADMIN role with subscription limits
4. Invite team members

---

## Subscription Tiers & Pricing

| Tier | Price | Agents | Sub-Admins | Customers | Campaigns | Features |
|------|-------|--------|------------|-----------|-----------|----------|
| **STARTER** | $39.99/mo | 5 | 1 | 500 | 10 | Basic features |
| **ELITE** | $69.99/mo | 15 | 3 | 2,000 | 25 | + AI Content, Analytics |
| **PRO** | $99.99/mo | 50 | 10 | 10,000 | 100 | + Custom Branding, Priority Support |
| **ENTERPRISE** | $299.99/mo | Unlimited | Unlimited | Unlimited | Unlimited | All features + Dedicated Manager |

---

## Complete Signup Flow

### Step 1: Choose Subscription Plan
**Page:** `/auth/signup`

Users see all four subscription plans with:
- Price and billing period
- Feature comparison
- Number of agents, customers, campaigns allowed
- Visual indicators for the most popular plan (ELITE)

```typescript
// Plans are defined in: src/config/subscriptions.ts
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan>
```

### Step 2: Enter Account Details
After selecting a plan, users provide:
- Full name
- Email address
- Password (minimum 8 characters)
- **Organization name** (required)

### Step 3: Automatic Organization Creation
**API Endpoint:** `POST /api/auth/register`

The system automatically:
1. ✅ Validates subscription tier
2. ✅ Creates unique organization slug
3. ✅ Creates organization with subscription limits
4. ✅ Creates user as CORPORATE_ADMIN
5. ✅ Links user to their organization
6. ✅ Auto-signs user in
7. ✅ Redirects to dashboard

```typescript
// Example request body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "organizationName": "Acme Corporation",
  "subscriptionTier": "ELITE"
}
```

### Step 4: User Gets Admin Access
The registered user becomes:
- **Role:** `CORPORATE_ADMIN`
- **Permissions:** 
  - Invite team members
  - Manage sub-admins and agents
  - Access all features within subscription limits
  - View organization analytics

### Step 5: Invite Team Members
**Page:** `/dashboard/team`

As CORPORATE_ADMIN, the user can:
- View all team members
- Invite new agents (up to subscription limit)
- Invite sub-admins (up to subscription limit)
- Remove team members
- Assign roles

---

## Subscription Limits Enforcement

Each organization has the following limits based on their subscription:

### STARTER Plan ($39.99/mo)
```typescript
maxAgents: 5
maxSubAdmins: 1
maxCustomers: 500
maxCampaigns: 10
maxEmailsPerMonth: 5000
maxSMSPerMonth: 1000
maxVoiceMinutesPerMonth: 100
```

### ELITE Plan ($69.99/mo) ⭐ MOST POPULAR
```typescript
maxAgents: 15
maxSubAdmins: 3
maxCustomers: 2000
maxCampaigns: 25
maxEmailsPerMonth: 15000
maxSMSPerMonth: 5000
maxVoiceMinutesPerMonth: 500
aiContentGeneration: true
advancedAnalytics: true
```

### PRO Plan ($99.99/mo)
```typescript
maxAgents: 50
maxSubAdmins: 10
maxCustomers: 10000
maxCampaigns: 100
maxEmailsPerMonth: 50000
maxSMSPerMonth: 20000
maxVoiceMinutesPerMonth: 2000
customBranding: true
prioritySupport: true
```

### ENTERPRISE Plan ($299.99/mo)
```typescript
maxAgents: 999999 (unlimited)
maxSubAdmins: 999999 (unlimited)
maxCustomers: 999999 (unlimited)
maxCampaigns: 999999 (unlimited)
maxEmailsPerMonth: 999999 (unlimited)
maxSMSPerMonth: 999999 (unlimited)
maxVoiceMinutesPerMonth: 999999 (unlimited)
dedicatedAccountManager: true
```

---

## Database Schema

### Organization Model
```prisma
model Organization {
  id                        String              @id @default(cuid())
  name                      String
  slug                      String              @unique
  subscriptionTier          SubscriptionTier?
  subscriptionStatus        SubscriptionStatus  @default(ACTIVE)
  subscriptionStartDate     DateTime?
  subscriptionEndDate       DateTime?
  
  // Subscription Limits
  maxSubAdmins              Int                 @default(0)
  maxAgents                 Int                 @default(0)
  maxCustomers              Int                 @default(1000)
  maxCampaigns              Int                 @default(10)
  maxEmailsPerMonth         Int                 @default(5000)
  maxSMSPerMonth            Int                 @default(1000)
  maxVoiceMinutesPerMonth   Int                 @default(100)
  
  // Relations
  users                     User[]
  customers                 Customer[]
  campaigns                 Campaign[]
  // ... other relations
}
```

### Subscription Enums
```prisma
enum SubscriptionTier {
  STARTER
  ELITE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  SUSPENDED
}
```

---

## API Endpoints

### Registration with Subscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "organizationName": "Acme Corp",
  "subscriptionTier": "ELITE"
}
```

**Response:**
```json
{
  "message": "Account and organization created successfully.",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CORPORATE_ADMIN",
    "organizationId": "...",
    "createdAt": "2025-11-18T..."
  },
  "organization": {
    "id": "...",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "subscriptionTier": "ELITE"
  }
}
```

### Team Invitation
```http
POST /api/team/invite
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "email": "agent@example.com",
  "name": "New Agent",
  "role": "AGENT"
}
```

---

## User Roles & Permissions

### CORPORATE_ADMIN (Signup Role)
- Full access to their organization
- Can invite sub-admins (up to subscription limit)
- Can invite agents (up to subscription limit)
- Can manage all team members
- Can view organization analytics
- Can upgrade/downgrade subscription
- **LIMITED BY:** Subscription tier features

### SUB_ADMIN
- Can invite agents only
- Can manage customers
- Can create and manage campaigns
- Cannot remove CORPORATE_ADMIN
- **LIMITED BY:** Subscription tier features

### AGENT
- Can manage assigned customers
- Can make calls and send messages
- Can view assigned campaigns
- Cannot invite users
- **LIMITED BY:** Subscription tier features

### SUPER_ADMIN (System-wide)
- Can access all organizations
- Can manage any user
- Can override subscription limits
- System administration access

---

## Testing the Flow

### Test User Signup
1. Navigate to: http://localhost:3000/auth/signup
2. Select a subscription plan (e.g., ELITE - $69.99)
3. Fill in details:
   - Name: Test User
   - Email: testuser@example.com
   - Password: TestPass123
   - Organization: Test Company
4. Submit form
5. System creates organization and user
6. Auto-redirects to dashboard

### Verify Organization Creation
```javascript
// Check in database or via API
const org = await prisma.organization.findFirst({
  where: { name: "Test Company" },
  include: { users: true }
});

// Should have:
// - subscriptionTier: "ELITE"
// - maxAgents: 15
// - maxSubAdmins: 3
// - User with role: "CORPORATE_ADMIN"
```

### Test Team Invitation
1. Go to: http://localhost:3000/dashboard/team
2. Click "Invite Team Member"
3. Enter email and select role (AGENT or SUB_ADMIN)
4. Submit
5. New user created with:
   - Same organizationId
   - Selected role
   - Temporary password (sent via email)

---

## Feature Comparison

| Feature | Starter | Elite | Pro | Enterprise |
|---------|---------|-------|-----|------------|
| Email Campaigns | ✅ | ✅ | ✅ | ✅ |
| SMS Campaigns | ✅ | ✅ | ✅ | ✅ |
| Social Media Posts | ✅ | ✅ | ✅ | ✅ |
| AI Content Generation | ❌ | ✅ | ✅ | ✅ |
| Advanced Analytics | ❌ | ✅ | ✅ | ✅ |
| Custom Branding | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| Dedicated Manager | ❌ | ❌ | ❌ | ✅ |

---

## Next Steps (Future Enhancements)

### Payment Integration
- [ ] Stripe integration for automatic billing
- [ ] Payment method management
- [ ] Invoice generation
- [ ] Failed payment handling

### Subscription Management
- [ ] Upgrade/downgrade plans
- [ ] Subscription renewal
- [ ] Usage tracking dashboard
- [ ] Overage charges for limits

### Organization Features
- [ ] Organization settings page
- [ ] Billing history
- [ ] Usage analytics
- [ ] Team usage reports

### Limit Enforcement
- [ ] Real-time limit checking on campaign creation
- [ ] Warning when approaching limits
- [ ] Upgrade prompts when limits reached
- [ ] Usage reset on billing cycle

---

## File Structure

```
src/
├── app/
│   ├── auth/
│   │   └── signup/
│   │       └── page.tsx          # Subscription plan selection & signup form
│   ├── api/
│   │   ├── auth/
│   │   │   └── register/
│   │   │       └── route.ts      # Organization creation + user registration
│   │   └── team/
│   │       ├── route.ts          # Get team members
│   │       ├── invite/
│   │       │   └── route.ts      # Invite new team members
│   │       └── [userId]/
│   │           └── route.ts      # Remove team members
│   └── dashboard/
│       └── team/
│           └── page.tsx          # Team management UI
├── config/
│   └── subscriptions.ts          # Subscription plans configuration
├── lib/
│   └── prisma.ts                 # Prisma client
└── prisma/
    └── schema.prisma             # Database schema with subscriptions
```

---

## Summary

✅ **Fully Implemented:**
- Subscription plan selection on signup
- Automatic organization creation with limits
- CORPORATE_ADMIN role assignment
- Team invitation system
- Role-based permissions
- Multi-tenant data isolation

✅ **Ready to Use:**
- Visit: http://localhost:3000/auth/signup
- Select plan → Create account → Start inviting team

✅ **Subscription Tiers:**
- Starter: $39.99/mo
- Elite: $69.99/mo (Most Popular)
- Pro: $99.99/mo
- Enterprise: $299.99/mo

---

*Last Updated: November 18, 2025*
