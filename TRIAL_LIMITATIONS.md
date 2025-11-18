# Trial Period & Feature Restrictions

## Overview
Users get a **30-day free trial** with **no credit card required**. During the trial, they have **limited access** to premium features and must upgrade to unlock full benefits.

---

## Trial Limitations

### What's Restricted During Trial:

**Features Blocked:**
- 🤖 AI Content Generation
- 📊 Advanced Analytics & Custom Reports
- 🎨 Custom Branding & White Labeling
- 🔌 API Access
- ⚡ Marketing Automation
- 📥 Data Export
- 🎧 Priority Support
- 🤝 White Glove Service

**Usage Limits (Stricter than subscriptions):**
- **Campaigns**: 2 max (vs plan limits)
- **Emails**: 50 per day (vs plan limits)
- **SMS**: 20 per day (vs plan limits)
- **Customers**: 25 max (vs plan limits)

**What's Available:**
- ✅ Email campaigns (limited)
- ✅ SMS campaigns (limited)
- ✅ Basic customer management
- ✅ Campaign scheduling
- ✅ Basic reports
- ✅ Team member invites

---

## Implementation

### 1. Check Trial Status

```typescript
import { isUserOnTrial, getDaysRemainingInTrial } from '@/lib/trial-limits'

// In your component or API route
const isOnTrial = isUserOnTrial(
  organization.subscriptionStatus,
  organization.subscriptionStartDate
)

const daysRemaining = getDaysRemainingInTrial(organization.subscriptionStartDate)
```

### 2. Show Trial Banner (Dashboard)

```typescript
import TrialBanner from '@/components/TrialBanner'

// In dashboard layout or main page
{isOnTrial && (
  <TrialBanner
    subscriptionStartDate={organization.subscriptionStartDate}
    organizationName={organization.name}
  />
)}
```

### 3. Lock Premium Features

```typescript
import LockedFeature from '@/components/LockedFeature'
import { isUserOnTrial } from '@/lib/trial-limits'

// Wrap premium feature with lock
{isOnTrial ? (
  <LockedFeature
    featureName="AI Content Generation"
    daysRemaining={daysRemaining}
    icon="🤖"
  >
    {/* The actual feature UI (will be blurred) */}
    <AIContentGenerator />
  </LockedFeature>
) : (
  <AIContentGenerator />
)}
```

### 4. Show Upgrade Prompt (Manual Trigger)

```typescript
import UpgradePrompt from '@/components/UpgradePrompt'
import { useState } from 'react'

const [showUpgrade, setShowUpgrade] = useState(false)

// When user tries to access locked feature
<button onClick={() => setShowUpgrade(true)}>
  Generate AI Content
</button>

{showUpgrade && (
  <UpgradePrompt
    featureName="AI Content Generation"
    daysRemaining={daysRemaining}
    onClose={() => setShowUpgrade(false)}
  />
)}
```

### 5. Enforce Limits in API Routes

```typescript
import { TRIAL_LIMITS, isUserOnTrial } from '@/lib/trial-limits'

export async function POST(req: Request) {
  // Get organization from session
  const organization = await getOrganization(session.user.organizationId)
  
  const isOnTrial = isUserOnTrial(
    organization.subscriptionStatus,
    organization.subscriptionStartDate
  )
  
  if (isOnTrial) {
    // Check campaign count
    const campaignCount = await prisma.emailCampaign.count({
      where: { organizationId: organization.id }
    })
    
    if (campaignCount >= TRIAL_LIMITS.maxCampaigns) {
      return NextResponse.json(
        { 
          error: 'Trial limit reached',
          message: `You can only create ${TRIAL_LIMITS.maxCampaigns} campaigns during trial. Upgrade to create more.`,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }
  }
  
  // Continue with campaign creation...
}
```

---

## Components

### 1. TrialBanner
Shows trial status at top of dashboard with countdown and upgrade CTA.

**Props:**
- `subscriptionStartDate: Date` - When trial started
- `organizationName: string` - Organization name

**Features:**
- Progress bar showing days remaining
- Changes to urgent orange color when <7 days left
- Dismissible
- Links to upgrade and pricing pages

### 2. UpgradePrompt
Modal dialog explaining locked feature and prompting upgrade.

**Props:**
- `featureName: string` - Name of the locked feature
- `daysRemaining?: number` - Days left in trial
- `onClose?: () => void` - Callback when closed

**Features:**
- Shows feature icon and description
- Lists all plans that include the feature
- Displays starting price
- Links to billing settings and pricing page

### 3. LockedFeature
Wraps and locks a premium feature during trial.

**Props:**
- `featureName: string` - Name of the locked feature
- `daysRemaining?: number` - Days left in trial
- `children?: React.ReactNode` - The actual feature UI
- `icon?: string` - Emoji icon for the feature

**Features:**
- Blurs and disables wrapped content
- Shows overlay with unlock button
- Opens upgrade prompt when clicked

---

## User Journey

### Day 0: Signup
1. User selects plan (Starter, Elite, Pro, Enterprise)
2. Enters details and creates account
3. Organization created with `subscriptionStatus: 'TRIALING'`
4. No payment required

### Days 1-23: Active Trial
1. Trial banner shows at top: "🎉 You're on a Free Trial - 23 days remaining"
2. User can access basic features
3. Premium features show lock icon/overlay
4. Clicking locked features shows upgrade prompt
5. Daily limits enforced (50 emails, 20 SMS, etc.)

### Days 24-29: Urgency Phase
1. Trial banner turns orange: "⚠️ Trial Ending Soon! - 6 days remaining"
2. More frequent upgrade prompts
3. Email reminders sent
4. Emphasize benefits of upgrading

### Day 30: Trial Ends
1. Account moves to `subscriptionStatus: 'EXPIRED'`
2. Access restricted to view-only mode
3. Strong upgrade prompt blocks all actions
4. Can only access billing settings to upgrade

### After Upgrade
1. Status changes to `subscriptionStatus: 'ACTIVE'`
2. All features unlocked based on plan
3. Full usage limits apply
4. No more trial banners

---

## API Enforcement Points

### Campaign Creation
```typescript
// src/app/api/campaigns/route.ts
if (isOnTrial && campaignCount >= TRIAL_LIMITS.maxCampaigns) {
  return error('Trial limit: 2 campaigns max')
}
```

### Email Sending
```typescript
// src/app/api/email/send/route.ts
if (isOnTrial) {
  const emailsToday = await getEmailsSentToday(organizationId)
  if (emailsToday >= TRIAL_LIMITS.maxEmailsPerDay) {
    return error('Trial limit: 50 emails per day')
  }
}
```

### Customer Import
```typescript
// src/app/api/customers/import/route.ts
if (isOnTrial && customerCount >= TRIAL_LIMITS.maxCustomers) {
  return error('Trial limit: 25 customers max')
}
```

### AI Content
```typescript
// src/app/api/ai/generate/route.ts
if (isOnTrial && !TRIAL_LIMITS.canAccessAIContent) {
  return error('AI content requires paid plan')
}
```

### Data Export
```typescript
// src/app/api/export/route.ts
if (isOnTrial && !TRIAL_LIMITS.canExportData) {
  return error('Data export requires paid plan')
}
```

---

## Database Schema

### Organization Status
```prisma
model Organization {
  subscriptionStatus   SubscriptionStatus @default(TRIALING)
  subscriptionStartDate DateTime?
  subscriptionEndDate   DateTime?
  subscriptionTier     SubscriptionPlan @default(FREE)
}

enum SubscriptionStatus {
  TRIALING  // 30-day free trial
  ACTIVE    // Paid and active
  CANCELLED // User cancelled
  PAST_DUE  // Payment failed
  EXPIRED   // Trial ended without payment
}
```

---

## Configuration

### Trial Limits (`src/lib/trial-limits.ts`)
```typescript
export const TRIAL_LIMITS: TrialLimits = {
  canAccessAIContent: false,
  canAccessAdvancedAnalytics: false,
  canAccessCustomBranding: false,
  canAccessWhiteGlove: false,
  canAccessAPI: false,
  
  maxCampaigns: 2,
  maxEmailsPerDay: 50,
  maxSMSPerDay: 20,
  maxCustomers: 25,
  
  canExportData: false,
  canScheduleCampaigns: true,
  canUseAutomation: false,
  canAccessReports: true,
}
```

### Restricted Features List
```typescript
export const RESTRICTED_FEATURES = [
  {
    name: 'AI Content Generation',
    description: 'Let AI write your marketing content',
    icon: '🤖',
    availableIn: ['ELITE', 'PRO', 'ENTERPRISE'],
  },
  // ... more features
]
```

---

## Testing

### Test Trial Flow
1. Create new account → Should see trial banner
2. Try to create 3 campaigns → Should block after 2
3. Click locked AI feature → Should show upgrade prompt
4. Send 51 emails in one day → Should block after 50
5. Wait until day 25 → Banner should turn orange
6. Upgrade to paid plan → Banner disappears, all features unlock

---

## Files Created

1. **`src/lib/trial-limits.ts`** - Trial configuration and helper functions
2. **`src/components/TrialBanner.tsx`** - Top banner showing trial status
3. **`src/components/UpgradePrompt.tsx`** - Modal for upgrade prompts
4. **`src/components/LockedFeature.tsx`** - Wrapper to lock premium features
5. **`src/app/api/auth/register/route.ts`** - Updated to set TRIALING status

---

## Next Steps

1. ✅ Add trial banner to dashboard layout
2. ✅ Wrap premium features with LockedFeature
3. ✅ Add API route enforcement for limits
4. ✅ Create billing/upgrade page
5. ✅ Set up email reminders for trial expiration
6. ✅ Add analytics to track upgrade conversions

---

*All new signups start with TRIALING status and full 30-day trial access!*
