# SMS Rate Limiting - 1 Message Per Customer Per Day

## Overview

Automated SMS rate limiting system that ensures each customer receives a maximum of **1 message per day**, preventing spam and improving customer experience.

## Features

✅ **1 Message Per Day Limit** - Each customer can only receive 1 outbound SMS per 24-hour period  
✅ **Automatic Enforcement** - Rate limits checked before every SMS send  
✅ **Multi-Tenant Support** - Works across different organizations  
✅ **Smart Tracking** - Counts messages from midnight to midnight  
✅ **Campaign Integration** - Automatically skips rate-limited customers during campaign sends  
✅ **Detailed Reporting** - Shows rate-limited counts and reasons  
✅ **API Endpoints** - Check rate limit status for any customer

## How It Works

### Rate Limit Check Flow

```
1. Campaign Send Initiated
   ↓
2. For Each Customer:
   → Check messages sent today
   → If < 1 message: SEND ✅
   → If >= 1 message: SKIP 🚫
   ↓
3. Log Results:
   - Sent: X customers
   - Failed: Y customers
   - Rate Limited: Z customers
```

### Time Window

- **Start**: Midnight (00:00:00) local time
- **End**: 11:59:59 PM same day
- **Reset**: Automatically at midnight each day

## Configuration

### Current Settings

Located in `src/lib/sms-rate-limit.ts`:

```typescript
export const SMS_RATE_LIMITS = {
  MAX_PER_DAY: 1, // Maximum messages per customer per day
  COOLDOWN_HOURS: 24, // Hours before next message allowed
};
```

### Adjusting Limits

To change the daily limit, update `MAX_PER_DAY`:

```typescript
// Allow 2 messages per day
MAX_PER_DAY: 2,

// Allow 5 messages per day
MAX_PER_DAY: 5,
```

## API Usage

### Check Customer Rate Limit

**Endpoint**: `GET /api/sms-rate-limit?customerId=xxx`

**Request**:

```bash
curl https://yourdomain.com/api/sms-rate-limit?customerId=cust_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:

```json
{
  "customer": {
    "id": "cust_123",
    "name": "John Doe",
    "phone": "+15551234567"
  },
  "rateLimit": {
    "allowed": false,
    "maxPerDay": 1,
    "messagesSentToday": 1,
    "remainingCooldown": 18,
    "lastMessageAt": "2025-12-24T10:30:00Z"
  },
  "stats": {
    "last30Days": 15,
    "today": 1,
    "lastMessage": "2025-12-24T10:30:00Z",
    "canSendToday": false
  }
}
```

### Get Rate Limit Configuration

**Endpoint**: `POST /api/sms-rate-limit/config`

**Response**:

```json
{
  "config": {
    "maxPerDay": 1,
    "cooldownHours": 24
  }
}
```

## Campaign Send Behavior

### Before Rate Limiting

```
Campaign to 100 customers:
- Sent: 100 messages
- No duplicate protection
```

### After Rate Limiting

```
Campaign to 100 customers:
- Day 1: 100 sent ✅
- Day 1 (2nd campaign): 0 sent (all rate limited) 🚫
- Day 2: 100 sent ✅ (reset at midnight)
```

### Response Example

When sending a campaign with rate limiting:

```json
{
  "success": true,
  "data": {
    "sent": 85,
    "failed": 5,
    "rateLimited": 10,
    "total": 100,
    "message": "10 customer(s) skipped due to rate limit (1 message per day limit)"
  }
}
```

## Testing

### Test Rate Limiting

Run the test script:

```bash
node scripts/test-rate-limit.js
```

**Output**:

```
🧪 Testing SMS Rate Limiting...

📋 Configuration:
  Max messages per day: 1
  Cooldown period: 24 hours

👤 Test Customer:
  Name: John Doe
  Phone: +15551234567
  ID: cust_123

📊 Messages Sent Today:
  Count: 1
  1. [DELIVERED] 10:30:45 AM - Holiday Sale! Get 20% off today...

🔍 Checking Rate Limit...
🚫 BLOCKED - Rate limit exceeded
  Messages sent today: 1/1
  Last message: 12/24/2025, 10:30:45 AM
  Cooldown remaining: 14 hours

📊 All Customers - Today's Message Count:
═════════════════════════════════════════
🚫 BLOCKED John Doe - 1/1 messages (+15551234567)
✅ CAN SEND Jane Smith - 0/1 messages (+15559876543)
✅ CAN SEND Bob Johnson - 0/1 messages (+15554567890)
```

### Test Sending Multiple Campaigns

1. **Send First Campaign**:

   ```bash
   # Send campaign to all customers
   # Result: 100 sent, 0 rate limited
   ```

2. **Send Second Campaign (Same Day)**:

   ```bash
   # Send another campaign immediately
   # Result: 0 sent, 100 rate limited ✅
   ```

3. **Send Third Campaign (Next Day)**:
   ```bash
   # Wait until next day, send again
   # Result: 100 sent, 0 rate limited ✅
   ```

## Database Tracking

### Query Messages Sent Today

```sql
SELECT
  c.firstName,
  c.lastName,
  c.phone,
  COUNT(*) as messages_today
FROM sms_messages m
JOIN customers c ON m.customerId = c.id
WHERE
  m.direction = 'OUTBOUND'
  AND m.sentAt >= CURRENT_DATE
GROUP BY c.id, c.firstName, c.lastName, c.phone
ORDER BY messages_today DESC;
```

### Find Rate-Limited Customers

```sql
SELECT
  c.firstName,
  c.lastName,
  c.phone,
  COUNT(*) as message_count,
  MAX(m.sentAt) as last_message
FROM sms_messages m
JOIN customers c ON m.customerId = c.id
WHERE
  m.direction = 'OUTBOUND'
  AND m.sentAt >= CURRENT_DATE
GROUP BY c.id, c.firstName, c.lastName, c.phone
HAVING COUNT(*) >= 1
ORDER BY last_message DESC;
```

## Code Integration

### SMS Service

The rate limit check is automatically integrated:

```typescript
// src/services/sms.service.ts
const result = await SmsService.send({
  to: "+15551234567",
  message: "Hello!",
  userId: user.id,
  organizationId: org.id,
});

// If rate limited:
{
  success: false,
  error: "Rate limit exceeded",
  rateLimitInfo: {
    messagesSentToday: 1,
    remainingCooldown: 18,
    lastMessageAt: "2025-12-24T10:30:00Z"
  }
}
```

### Campaign Send

Rate limiting is enforced during campaign sends:

```typescript
// Automatically skips rate-limited customers
for (const customer of customers) {
  const result = await SmsService.send({...});

  if (result.error === "Rate limit exceeded") {
    rateLimitedCount++;
    // Customer skipped, not counted as failed
  }
}
```

## Benefits

### For Customers

- ✅ No spam - maximum 1 message per day
- ✅ Better experience - not overwhelmed with messages
- ✅ Compliance - follows SMS best practices

### For Business

- ✅ Cost savings - no duplicate sends
- ✅ Better engagement - higher open rates
- ✅ Deliverability - reduced spam complaints
- ✅ Reputation - maintains sender reputation

## Monitoring

### Daily Report

Check daily message volume:

```bash
node scripts/check-daily-messages.js
```

Shows:

- Total messages sent per day
- Messages per customer
- Rate-limited customers

### Rate Limit Dashboard

View in admin dashboard:

- Customers at rate limit today
- Average messages per customer
- Rate limit efficiency (% skipped)

## Troubleshooting

### Customer Not Receiving Messages

1. **Check Rate Limit Status**:

   ```bash
   curl /api/sms-rate-limit?customerId=xxx
   ```

2. **Check Today's Messages**:

   ```sql
   SELECT * FROM sms_messages
   WHERE customerId = 'xxx'
   AND sentAt >= CURRENT_DATE;
   ```

3. **Wait for Reset**: Rate limits reset at midnight

### Campaign Shows All Rate Limited

**Cause**: All customers already received a message today

**Solution**:

- Wait until tomorrow to send
- Check if another campaign was sent today
- Review automated message schedules

### Need to Send Urgent Message

**Option 1**: Wait until midnight for reset

**Option 2**: Temporarily increase limit:

```typescript
// src/lib/sms-rate-limit.ts
MAX_PER_DAY: 2,  // Increase to 2
```

**Option 3**: Send manually (bypasses rate limit if needed)

## Best Practices

### Campaign Scheduling

✅ **DO**: Schedule campaigns at different times of day  
✅ **DO**: Space campaigns 24+ hours apart  
✅ **DO**: Monitor rate-limited counts  
✅ **DO**: Review customer message history

❌ **DON'T**: Send multiple campaigns same day  
❌ **DON'T**: Expect 100% delivery if already sent today  
❌ **DON'T**: Override rate limits without good reason

### Message Timing

- **Best Time**: 10 AM - 8 PM local time
- **Avoid**: Before 8 AM or after 9 PM
- **Frequency**: Once per day maximum
- **Content**: Make each message count

## Advanced Features

### Custom Rate Limits Per Organization

To add organization-specific limits:

```typescript
// Check organization settings first
const orgSettings = await prisma.organizationSettings.findUnique({
  where: { organizationId },
});

const maxPerDay = orgSettings?.smsRateLimit || SMS_RATE_LIMITS.MAX_PER_DAY;
```

### VIP Customers Exception

To allow VIP customers more messages:

```typescript
const customer = await prisma.customer.findUnique({
  where: { id: customerId },
  select: { isVip: true },
});

const maxPerDay = customer.isVip ? 3 : SMS_RATE_LIMITS.MAX_PER_DAY;
```

## Future Enhancements

- [ ] Per-customer rate limit preferences
- [ ] Time-based windows (e.g., no messages on weekends)
- [ ] Priority message queue (urgent vs. promotional)
- [ ] Opt-out from specific message types
- [ ] Analytics dashboard for rate limit metrics
- [ ] SMS scheduling to avoid rate limits

---

**Version**: 1.0  
**Last Updated**: December 24, 2025  
**Status**: ✅ Production Ready
