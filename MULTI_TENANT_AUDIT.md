# Multi-Tenant Architecture Audit & Fix Plan

**Date**: November 17, 2025  
**Status**: 🔴 CRITICAL - Multi-tenancy not properly enforced  

---

## 🎯 Enterprise Multi-Tenancy Requirements

This platform is designed for **multi-tenant SaaS** where:
- Multiple organizations can sign up independently
- Each organization has isolated data (customers, campaigns, calls, etc.)
- Users belong to one organization (`organizationId`)
- **Stripe webhooks** remain platform-level (not scoped to organization)
- All other APIs/webhooks must filter by `organizationId`

---

## ❌ Current Issues

### 1. Missing `organizationId` in Database Models

These models **MUST** have `organizationId` field:

| Model | Status | Impact |
|-------|--------|--------|
| `EmailCampaign` | ❌ Missing | Org A can see Org B's campaigns |
| `SmsCampaign` | ❌ Missing | Org A can see Org B's campaigns |
| `VoiceCampaign` | ❓ Check if exists | Data leakage risk |
| `Call` | ❌ Missing | Org A can see Org B's call records |
| `ChatConversation` | ❌ Missing | Org A can see Org B's chats |
| `IvrMenu` | ❌ Missing | Orgs should have separate IVR configs |
| `EmailMessage` | ❌ Missing | Indirect leak through campaigns |
| `SmsMessage` | ❌ Missing | Indirect leak through campaigns |
| `ChatMessage` | ✅ Safe | Linked through ChatConversation |
| `AnalyticsEvent` | ❌ Missing | Analytics mixed across orgs |
| `KnowledgeBase` | ❌ Missing | Shared knowledge base issue |
| `Integration` | ❌ Missing | Integrations not org-specific |
| `Webhook` | ❌ Missing | Webhooks not org-specific |
| `ApiKey` | ⚠️ Partial | Has userId but needs orgId too |
| `Report` | ❌ Missing | Reports not org-specific |

**Already Correct:**
- ✅ `Customer` - has `organizationId`
- ✅ `User` - has `organizationId`
- ✅ `Organization` - base model
- ✅ `SocialAccount` - has `organizationId`
- ✅ `SocialPost` - has `organizationId`
- ✅ `Subscription` - per user (correct)
- ✅ `Invoice` - per subscription (correct via Stripe)

---

### 2. API Routes Not Filtering by organizationId

#### ❌ Customer API (`/api/customers/route.ts`)
```typescript
// WRONG - Only filters by createdById
where: {
  createdById: session.user.id,
}

// CORRECT - Must filter by organizationId
where: {
  organizationId: session.user.organizationId,
}
```

#### ❌ Email Campaign API
- `/api/email-campaigns/route.ts` - Not filtering by orgId
- `/api/email/campaigns/route.ts` - Not filtering by orgId

#### ❌ SMS Campaign API
- `/api/sms/campaigns/route.ts` - Not filtering by orgId

#### ❌ Voice/Call Center API
- `/api/call-center/calls/route.ts` - Not filtering by orgId
- `/api/call-center/aws-connect/*` - Not filtering by orgId

#### ❌ Social Media API
- `/api/social/posts/route.ts` - Filtering by userId (should be orgId)
- `/api/social/accounts/route.ts` - Filtering by userId (should be orgId)
- `/api/social/analytics/route.ts` - Not org-scoped

#### ❌ Dashboard Stats
- `/api/dashboard/stats/route.ts` - Using userId instead of organizationId

---

### 3. Webhook Handlers Not Org-Aware

#### ⚠️ Email Webhooks (`/api/webhooks/email/route.ts`)
- Must identify organization from message data
- Update correct org's campaign stats

#### ⚠️ SMS Webhooks (`/api/webhooks/sms/route.ts`)
- Must identify organization from Twilio number
- Route incoming SMS to correct org

#### ⚠️ Voice Webhooks (`/api/webhooks/voice/status/route.ts`)
- Must identify organization from call record
- Update correct org's call stats

#### ✅ Stripe Webhooks (`/api/webhooks/stripe/route.ts`)
- **Correct** - Platform-level, not org-scoped
- Handles subscriptions globally

---

## 🔧 Fix Plan

### Phase 1: Database Schema Updates

**File**: `prisma/schema.prisma`

Add `organizationId` to these models:

```prisma
model EmailCampaign {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model SmsCampaign {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model Call {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model ChatConversation {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model IvrMenu {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model EmailMessage {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model SmsMessage {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model KnowledgeBase {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model Integration {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model Webhook {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model ApiKey {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model Report {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}

model AnalyticsEvent {
  // ... existing fields
  
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of model
  
  @@index([organizationId])
}
```

**Migration Command**:
```bash
npx prisma migrate dev --name add_organization_id_multi_tenant
```

---

### Phase 2: API Route Updates

#### Customer API Pattern (Apply to All Routes)

```typescript
// GET - List with org filter
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  const where: any = {
    organizationId: session.user.organizationId, // ✅ Org filter
  }

  // Additional filters...
  
  const customers = await prisma.customer.findMany({ where })
  return NextResponse.json({ data: customers })
}

// POST - Create with org
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  const customer = await prisma.customer.create({
    data: {
      ...validatedData,
      createdById: session.user.id,
      organizationId: session.user.organizationId, // ✅ Set org
    },
  })
  
  return NextResponse.json({ data: customer })
}

// GET by ID - Verify org ownership
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  const customer = await prisma.customer.findFirst({
    where: {
      id: params.id,
      organizationId: session.user.organizationId, // ✅ Verify org
    },
  })
  
  if (!customer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  return NextResponse.json({ data: customer })
}
```

**Apply this pattern to ALL routes:**
- ✅ `/api/customers/*`
- ✅ `/api/email-campaigns/*`
- ✅ `/api/email/campaigns/*`
- ✅ `/api/sms/campaigns/*`
- ✅ `/api/call-center/*`
- ✅ `/api/social/posts/*`
- ✅ `/api/social/accounts/*`
- ✅ `/api/chatbot/*`
- ✅ `/api/analytics/*`
- ✅ `/api/ivr/flows/*`
- ❌ `/api/webhooks/stripe/*` - Platform-level, no changes

---

### Phase 3: Webhook Handler Updates

#### Email Webhook Pattern
```typescript
export async function POST(request: NextRequest) {
  const webhookData = await request.json()
  
  // Find message with org
  const message = await prisma.emailMessage.findFirst({
    where: { 
      id: webhookData.messageId,
    },
    include: {
      customer: { include: { organization: true } },
    },
  })
  
  if (!message?.organizationId) {
    return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  }
  
  // Update with org context
  await prisma.emailMessage.update({
    where: { 
      id: message.id,
      organizationId: message.organizationId, // ✅ Verify org
    },
    data: { status: 'DELIVERED' },
  })
  
  return NextResponse.json({ success: true })
}
```

**Apply to:**
- `/api/webhooks/email/route.ts`
- `/api/webhooks/sms/route.ts`
- `/api/webhooks/sms/status/route.ts`
- `/api/webhooks/voice/status/route.ts`

---

### Phase 4: Middleware for Org Check

Create `src/middleware/organization.ts`:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireOrganization() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  
  if (!session.user.organizationId) {
    throw new Error('No organization assigned')
  }
  
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    role: session.user.role,
  }
}
```

---

## 🧪 Testing Plan

### Test Scenarios

1. **Data Isolation Test**
   - Create 2 test organizations
   - Create customers in each
   - Verify Org A cannot see Org B's customers

2. **Campaign Isolation Test**
   - Create email/SMS campaigns in both orgs
   - Verify each org only sees their campaigns

3. **API Endpoint Test**
   - Test all GET/POST/PUT/DELETE endpoints
   - Verify org filtering works

4. **Webhook Test**
   - Trigger email/SMS webhooks
   - Verify updates go to correct organization

5. **Stripe Exception Test**
   - Verify Stripe webhooks work globally
   - Not scoped to organization

---

## 📋 Implementation Checklist

### Database
- [ ] Add `organizationId` to EmailCampaign
- [ ] Add `organizationId` to SmsCampaign
- [ ] Add `organizationId` to Call
- [ ] Add `organizationId` to ChatConversation
- [ ] Add `organizationId` to IvrMenu
- [ ] Add `organizationId` to EmailMessage
- [ ] Add `organizationId` to SmsMessage
- [ ] Add `organizationId` to KnowledgeBase
- [ ] Add `organizationId` to Integration
- [ ] Add `organizationId` to Webhook
- [ ] Add `organizationId` to ApiKey
- [ ] Add `organizationId` to Report
- [ ] Add `organizationId` to AnalyticsEvent
- [ ] Run migration

### API Routes
- [ ] Fix `/api/customers/route.ts`
- [ ] Fix `/api/customers/[id]/route.ts`
- [ ] Fix `/api/email-campaigns/route.ts`
- [ ] Fix `/api/email/campaigns/route.ts`
- [ ] Fix `/api/sms/campaigns/route.ts`
- [ ] Fix `/api/call-center/calls/route.ts`
- [ ] Fix `/api/social/posts/route.ts`
- [ ] Fix `/api/social/accounts/route.ts`
- [ ] Fix `/api/dashboard/stats/route.ts`
- [ ] Fix `/api/analytics/route.ts`

### Webhooks
- [ ] Update `/api/webhooks/email/route.ts`
- [ ] Update `/api/webhooks/sms/route.ts`
- [ ] Update `/api/webhooks/sms/status/route.ts`
- [ ] Update `/api/webhooks/voice/status/route.ts`
- [ ] Verify `/api/webhooks/stripe/route.ts` remains platform-level

### Testing
- [ ] Test customer isolation
- [ ] Test campaign isolation
- [ ] Test call isolation
- [ ] Test social post isolation
- [ ] Test webhook routing
- [ ] Test Stripe webhooks (global)

---

## 🚨 Priority

**CRITICAL** - This must be fixed before production deployment!

**Risk Level**: 🔴 HIGH  
- Data leakage between organizations
- Potential GDPR/compliance violations
- Loss of customer trust

**Estimated Time**: 
- Schema updates: 2 hours
- API route fixes: 4-6 hours
- Webhook updates: 2 hours
- Testing: 2-4 hours
- **Total**: ~10-14 hours

---

## 📞 Next Steps

1. Review this audit with the team
2. Get approval to proceed
3. Create feature branch: `fix/multi-tenant-architecture`
4. Implement Phase 1 (Schema)
5. Implement Phase 2 (API Routes)
6. Implement Phase 3 (Webhooks)
7. Implement Phase 4 (Middleware)
8. Run comprehensive tests
9. Deploy to staging
10. Production deployment

---

**Last Updated**: November 17, 2025
