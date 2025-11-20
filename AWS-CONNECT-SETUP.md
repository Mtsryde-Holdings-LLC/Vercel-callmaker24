# AWS Connect Integration Guide

## Overview
Your CallMaker24 platform now integrates with **Amazon Connect** for enterprise-grade call center functionality with full multi-tenant support.

## Features ✨

### 🔒 Multi-Tenant Architecture
- Each organization gets isolated call handling
- Per-tenant metrics and reporting
- Organization-specific contact flows
- Complete data isolation

### 📞 Call Center Capabilities
- **Outbound Calling**: API-driven call initiation
- **Contact Flows (IVR)**: Visual flow designer in AWS Console
- **Real-time Metrics**: Live agent status and queue metrics
- **Call Recording**: Automatic recording with S3 storage
- **Queue Management**: Route calls based on skills/availability
- **Agent Dashboard**: Real-time agent status and call controls

### 💰 Cost-Effective
- Pay only for usage
- No upfront costs
- $0.018/minute for voice
- ~$0.03/day per phone number

## Setup Instructions

### Step 1: Create AWS Connect Instance

1. Go to [AWS Connect Console](https://console.aws.amazon.com/connect/)
2. Click **"Add an instance"**
3. **Identity Management**: Choose "Store users within Amazon Connect"
4. **Administrator**: Create admin user
5. **Telephony**: Enable both incoming and outgoing calls
6. **Data Storage**: Accept defaults (creates S3 buckets)
7. **Review**: Create instance (takes 1-2 minutes)

**Save These Values:**
- Instance Alias (e.g., `my-company`)
- Instance ARN (e.g., `arn:aws:connect:us-east-1:123456789012:instance/abc-123`)
- Instance ID (last part of ARN: `abc-123`)

### Step 2: Claim Phone Number

1. Open your Connect instance
2. Go to **Channels** → **Phone numbers**
3. Click **"Claim a number"**
4. Choose country (e.g., United States)
5. Select a phone number
6. Save and note the number (E.164 format: `+18005551234`)

### Step 3: Create Contact Flow (IVR)

1. In your instance, go to **Routing** → **Contact flows**
2. Click **"Create contact flow"**
3. **Simple Setup:**
   - Add "Play prompt" block: "Thank you for calling"
   - Add "Transfer to queue" block → BasicQueue
   - Connect Entry point → Play prompt → Transfer to queue
4. Click **"Save"** then **"Publish"**
5. Copy the **Contact Flow ID** (shows in URL or details)

**Or use the default flow:**
- Default Contact Flow ID is usually in your instance settings

### Step 4: Create IAM User for API Access

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **"Users"** → **"Add users"**
3. Username: `callmaker24-connect-api`
4. **Access type**: Programmatic access
5. **Permissions**: Attach existing policy → `AmazonConnectFullAccess`
6. Click through to create
7. **IMPORTANT**: Save the credentials:
   - Access Key ID: `AKIA...`
   - Secret Access Key: `...` (shown only once!)

### Step 5: Get Queue ID (Optional but Recommended)

1. In Connect instance, go to **Routing** → **Queues**
2. Find **"BasicQueue"** or create a new queue
3. Open queue details
4. Copy the **Queue ID** from the ARN
   - ARN format: `arn:aws:connect:region:account:instance/instance-id/queue/queue-id`
   - Queue ID is the last UUID

### Step 6: Configure Environment Variables

Edit `.env.local` and add:

```env
# AWS Connect (Call Center)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_CONNECT_INSTANCE_ID=12345678-1234-1234-1234-123456789012
AWS_CONNECT_INSTANCE_ARN=arn:aws:connect:us-east-1:123456789012:instance/12345678-1234-1234-1234-123456789012
AWS_CONNECT_INSTANCE_ALIAS=my-company
AWS_CONNECT_CONTACT_FLOW_ID=12345678-1234-1234-1234-123456789012
AWS_CONNECT_QUEUE_ID=12345678-1234-1234-1234-123456789012
AWS_CONNECT_PHONE_NUMBER=+18005551234
```

**Where to find each value:**
- `AWS_REGION`: Your instance region (e.g., us-east-1, us-west-2)
- `AWS_ACCESS_KEY_ID`: From IAM user creation (Step 4)
- `AWS_SECRET_ACCESS_KEY`: From IAM user creation (Step 4)
- `AWS_CONNECT_INSTANCE_ID`: Last part of Instance ARN
- `AWS_CONNECT_INSTANCE_ARN`: From instance overview page
- `AWS_CONNECT_INSTANCE_ALIAS`: Your instance URL subdomain
- `AWS_CONNECT_CONTACT_FLOW_ID`: From contact flow details (Step 3)
- `AWS_CONNECT_QUEUE_ID`: From queue details (Step 5)
- `AWS_CONNECT_PHONE_NUMBER`: Your claimed number (Step 2)

### Step 7: Test Configuration

Run the test script:
```bash
node scripts/test-aws-connect.js
```

Expected output:
```
✅ AWS Connect Connection Successful!
📊 Instance Details:
   • Instance Alias: my-company
   • Status: ACTIVE
   • Inbound Calls: Enabled
   • Outbound Calls: Enabled
```

### Step 8: Add to Vercel Production

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your CallMaker24 project
3. Go to **Settings** → **Environment Variables**
4. Add each AWS Connect variable:
   - Name: `AWS_REGION`, Value: `us-east-1`
   - Name: `AWS_ACCESS_KEY_ID`, Value: Your key
   - Name: `AWS_SECRET_ACCESS_KEY`, Value: Your secret
   - Name: `AWS_CONNECT_INSTANCE_ID`, Value: Your ID
   - (Repeat for all variables)
5. Select: **Production**, **Preview**, **Development**
6. Click **Save**
7. **Redeploy** to apply changes

## Usage

### Making Outbound Calls (API)

```typescript
// In your application
const response = await fetch('/api/call-center/aws-connect/make-call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+14155551234',
    contactFlowId: 'your-flow-id', // Optional, uses default
    queueId: 'your-queue-id', // Optional
    attributes: {
      customerName: 'John Doe',
      reason: 'Follow-up call'
    }
  })
})

const result = await response.json()
console.log('Call initiated:', result.contactId)
```

### Getting Real-time Metrics

```typescript
const response = await fetch('/api/call-center/aws-connect/metrics')
const { metrics } = await response.json()

console.log('Agents online:', metrics.agentsOnline)
console.log('Active calls:', metrics.agentsOnCall)
console.log('Queue size:', metrics.contactsInQueue)
```

### Listing Contact Flows

```typescript
const response = await fetch('/api/call-center/aws-connect/flows')
const { flows } = await response.json()

flows.forEach(flow => {
  console.log(`${flow.name} (${flow.id})`)
})
```

## Multi-Tenant Features

### Per-Organization Isolation

Each call automatically includes:
```javascript
{
  organizationId: user.organizationId,
  userId: user.id,
  userName: user.name
}
```

These attributes are passed to AWS Connect and can be used in:
- Call routing logic
- Reporting and analytics
- Contact flow decisions
- Lambda functions

### Database Integration

All calls are automatically logged to your database:
```sql
INSERT INTO calls (
  phoneNumber,
  direction,
  status,
  organizationId,
  userId,
  externalId -- AWS Connect Contact ID
)
```

## Advanced Configuration

### Custom Contact Flows

Create sophisticated IVR flows in AWS Console:

1. **Collect Input**: Get customer input (account number, etc.)
2. **Lambda Integration**: Call your API for business logic
3. **Conditional Routing**: Route based on customer data
4. **Queue Transfer**: Send to appropriate queue/agent
5. **Play Prompts**: Text-to-speech or uploaded audio

### Call Recording

Recordings are automatically saved to S3:
- Location: Configured during instance setup
- Format: WAV or MP3
- Retention: Configurable (default: indefinite)
- Access: Via S3 API or Connect console

### Agent Routing

Set up skill-based routing:
1. Create routing profiles
2. Assign skills to agents
3. Configure queue routing logic
4. Use in contact flows

## Troubleshooting

### Common Errors

**"ResourceNotFoundException"**
- Check `AWS_CONNECT_INSTANCE_ID` is correct
- Verify instance exists in correct region

**"AccessDeniedException"**
- Ensure IAM user has `AmazonConnectFullAccess` policy
- Check credentials are correct

**"InvalidParameterException"**
- Verify Contact Flow ID is correct and published
- Check phone number format (E.164: +1234567890)

**Call Not Connecting**
- Verify phone number is claimed in Connect
- Check contact flow is published and valid
- Ensure outbound calling is enabled

### Testing

```bash
# Test configuration
node scripts/test-aws-connect.js

# Test API locally (dev server must be running)
curl -X POST http://localhost:3000/api/call-center/aws-connect/init \
  -H "Content-Type: application/json"
```

## Cost Management

### Pricing Breakdown
- **Voice**: $0.018 per minute
- **Phone Numbers**: ~$0.03 per day
- **Storage (S3)**: $0.023 per GB per month
- **Data Transfer**: $0.09 per GB

### Monthly Cost Examples
| Usage | Estimated Cost |
|-------|----------------|
| 100 calls, 5 min avg | $9 + $1 number = $10/month |
| 1,000 calls, 5 min avg | $90 + $1 number = $91/month |
| 10,000 calls, 5 min avg | $900 + $1 number = $901/month |

### Cost Optimization
- Use shorter contact flows
- Implement self-service IVR
- Route efficiently to reduce hold time
- Review and archive old recordings

## Security

### IAM Best Practices
- Use separate IAM user for production
- Rotate credentials regularly
- Enable MFA on AWS account
- Use least-privilege permissions

### Data Protection
- Call recordings encrypted at rest (S3)
- Data in transit encrypted (TLS)
- PCI DSS compliant option available
- HIPAA compliant option available

## Support Resources

### Documentation
- **AWS Connect**: https://docs.aws.amazon.com/connect/
- **API Reference**: https://docs.aws.amazon.com/connect/latest/APIReference/
- **Best Practices**: https://docs.aws.amazon.com/connect/latest/adminguide/best-practices.html

### AWS Support
- **Forums**: https://forums.aws.amazon.com/forum.jspa?forumID=311
- **Support Plans**: https://aws.amazon.com/premiumsupport/

### Integration Code
- **Service**: `src/lib/aws-connect.service.ts`
- **API Routes**: `src/app/api/call-center/aws-connect/`
- **Frontend**: `src/app/dashboard/call-center/page.tsx`

## Next Steps

1. ✅ Complete AWS Connect setup
2. ✅ Test configuration locally
3. ✅ Add environment variables to Vercel
4. ✅ Deploy to production
5. 🔄 Create custom contact flows
6. 🔄 Set up agent routing profiles
7. 🔄 Configure call recording retention
8. 🔄 Integrate with CRM data
9. 🔄 Set up analytics dashboards
10. 🔄 Train agents on CCP interface

Your enterprise call center is ready! 🎉
