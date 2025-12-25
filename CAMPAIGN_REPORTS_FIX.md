# Campaign Reports Tracking Fix

## Issues Fixed

### 1. **Zero Delivery Rates**

- **Problem**: All SMS campaigns showed 0% delivery rate and 0 delivered messages
- **Root Cause**: Campaign counter fields (`deliveredCount`, `failedCount`) were not being updated
- **Solution**:
  - Modified reports API to calculate metrics from actual `SmsMessage` data in real-time
  - Updated send endpoint to properly set counter fields
  - Created webhook handler for Twilio status callbacks

### 2. **Stale Metrics**

- **Problem**: Metrics didn't update after messages were delivered
- **Root Cause**: No webhook handler to receive Twilio delivery status updates
- **Solution**:
  - Created `/api/webhooks/twilio/sms/status` endpoint
  - Configured status callback URL in SMS service
  - Auto-updates message statuses (DELIVERED, FAILED, etc.)

### 3. **No Real-Time Updates**

- **Problem**: Had to manually refresh page to see updated metrics
- **Root Cause**: No auto-refresh mechanism
- **Solution**:
  - Added auto-refresh toggle (30-second intervals)
  - Added manual refresh button with loading state
  - Shows last updated timestamp

## Changes Made

### 1. Backend API Changes

#### `/api/reports/campaigns/route.ts`

```typescript
// BEFORE: Used potentially stale counter fields
const delivered = campaign.deliveredCount;

// AFTER: Calculates from actual message data
const messages = await prisma.smsMessage.findMany({
  where: { campaignId: campaign.id },
  select: { status: true },
});
const delivered = messages.filter((m) => m.status === "DELIVERED").length;
```

#### `/api/sms-campaigns/[id]/send/route.ts`

```typescript
// BEFORE: Only updated totalRecipients
await prisma.smsCampaign.update({
  data: {
    totalRecipients: successCount,
  },
});

// AFTER: Updates all metrics
await prisma.smsCampaign.update({
  data: {
    totalRecipients: customers.length,
    deliveredCount: successCount,
    failedCount: failCount,
  },
});
```

### 2. New Endpoints Created

#### **Twilio Status Webhook**

`POST /api/webhooks/twilio/sms/status`

Receives delivery status updates from Twilio:

- Updates message status (DELIVERED, FAILED, UNDELIVERED)
- Records error codes and messages
- Automatically recalculates campaign metrics

**Setup in Twilio Console:**

```
Messaging → Settings → Webhook URL for status callbacks
POST https://yourdomain.com/api/webhooks/twilio/sms/status
```

#### **Sync Metrics Endpoint**

`POST /api/sms-campaigns/:id/sync-metrics`

Manually recalculate campaign metrics from message data:

```bash
curl -X POST https://yourdomain.com/api/sms-campaigns/campaign-id/sync-metrics \
  -H "Authorization: Bearer token"
```

Returns:

```json
{
  "success": true,
  "metrics": {
    "totalRecipients": 93,
    "deliveredCount": 85,
    "failedCount": 8,
    "repliedCount": 12,
    "optOutCount": 2,
    "deliveryRate": "91.4%"
  }
}
```

### 3. Frontend UI Improvements

#### **Auto-Refresh Toggle**

- Automatically refreshes data every 30 seconds
- Can be toggled on/off
- Shows "Auto-refresh ON/OFF" status

#### **Manual Refresh Button**

- Instant refresh with loading state
- Shows spinning icon while loading
- Updates "Last updated" timestamp

#### **Real-Time Status Display**

```
Last updated: 2:45:32 PM • Auto-refreshing every 30s
```

### 4. Utility Scripts

#### **Backfill Script**

`scripts/backfill-sms-metrics.js`

Recalculates metrics for all existing campaigns:

```bash
node scripts/backfill-sms-metrics.js
```

Output:

```
🔄 Starting SMS campaign metrics backfill...
Found 5 SMS campaign(s) to process.

📊 Processing: Holiday Sale (SENT)
   📈 Current: 93 sent, 0 delivered
   ✅ Updated: 93 sent, 85 delivered (91.4%)
   📉 Failed: 8, Replied: 12, Opted Out: 0
   ✔️  Metrics updated!

✨ Backfill complete!
   Updated: 2 campaign(s)
   Skipped: 3 campaign(s) (no messages)
```

## How It Works Now

### Message Delivery Flow

```
1. Campaign Sent
   → Messages created with status: SENT
   → Campaign counters updated

2. Twilio Delivers Message
   → Twilio sends webhook to /api/webhooks/twilio/sms/status
   → Message status updated to DELIVERED
   → Campaign metrics recalculated

3. UI Updates
   → Auto-refresh fetches latest data every 30s
   → Reports show real delivery rates
   → Metrics calculated from actual messages
```

### Metric Calculation

```typescript
// Real-time calculation from message data
const messages = await prisma.smsMessage.findMany({
  where: { campaignId },
  select: { status: true },
});

const metrics = {
  sent: messages.length,
  delivered: messages.filter((m) => m.status === "DELIVERED").length,
  failed: messages.filter((m) => m.status === "FAILED").length,
  deliveryRate: ((delivered / sent) * 100).toFixed(1) + "%",
};
```

## Testing

### 1. Test New Campaign

```bash
# Create and send campaign
# Check reports immediately - should show SENT
# Wait 30 seconds
# Should auto-refresh with DELIVERED count
```

### 2. Test Manual Refresh

```bash
# Click "Refresh" button
# Should see spinning icon
# Should update timestamp
# Should show latest metrics
```

### 3. Test Webhook

```bash
# Send test SMS
# Check Twilio logs for webhook calls
# Verify message status updated in database
```

### 4. Test Backfill

```bash
# Run: node scripts/backfill-sms-metrics.js
# Check reports page
# All campaigns should show correct metrics
```

## Configuration

### Environment Variables Required

```env
# Twilio credentials
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# App URL for webhooks
NEXTAUTH_URL=https://yourdomain.com
```

### Twilio Webhook Setup

1. Go to Twilio Console
2. Navigate to: **Messaging** → **Settings**
3. Set **Webhook URL for status callbacks**:
   ```
   POST https://yourdomain.com/api/webhooks/twilio/sms/status
   ```
4. Save configuration

## Monitoring

### Check Metrics Are Updating

```sql
-- Check recent message statuses
SELECT
  c.name as campaign,
  COUNT(*) as total,
  SUM(CASE WHEN m.status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN m.status = 'FAILED' THEN 1 ELSE 0 END) as failed,
  SUM(CASE WHEN m.status = 'SENT' THEN 1 ELSE 0 END) as sent_pending
FROM sms_messages m
JOIN sms_campaigns c ON m.campaignId = c.id
WHERE c.status = 'SENT'
GROUP BY c.id, c.name;
```

### Check Campaign Metrics

```sql
-- Compare campaign counters vs actual message counts
SELECT
  name,
  totalRecipients as counter_sent,
  deliveredCount as counter_delivered,
  (SELECT COUNT(*) FROM sms_messages WHERE campaignId = sms_campaigns.id) as actual_sent,
  (SELECT COUNT(*) FROM sms_messages WHERE campaignId = sms_campaigns.id AND status = 'DELIVERED') as actual_delivered
FROM sms_campaigns
WHERE status = 'SENT';
```

## Troubleshooting

### Metrics Still Showing Zero

1. **Run backfill script**:

   ```bash
   node scripts/backfill-sms-metrics.js
   ```

2. **Check message statuses**:

   ```sql
   SELECT status, COUNT(*)
   FROM sms_messages
   WHERE campaignId = 'your-campaign-id'
   GROUP BY status;
   ```

3. **Manually sync campaign**:
   ```bash
   curl -X POST /api/sms-campaigns/campaign-id/sync-metrics
   ```

### Webhook Not Working

1. **Check Twilio configuration**
2. **Verify NEXTAUTH_URL is set correctly**
3. **Check webhook logs in Twilio Console**
4. **Ensure endpoint is publicly accessible**

### Auto-Refresh Not Working

1. **Check browser console for errors**
2. **Verify API endpoint is accessible**
3. **Try manual refresh button**
4. **Check if auto-refresh is enabled**

## Benefits

✅ **Real-Time Accuracy**: Metrics calculated from actual message data  
✅ **Auto-Updates**: Dashboard refreshes automatically every 30 seconds  
✅ **Manual Control**: Refresh button for immediate updates  
✅ **Webhook Integration**: Twilio callbacks update statuses in real-time  
✅ **Historical Fix**: Backfill script fixes old campaign data  
✅ **Transparent**: Shows last updated time and auto-refresh status  
✅ **No Stale Data**: Always displays current delivery rates

## Next Steps

1. **Configure Twilio Webhook** - Enable status callbacks
2. **Run Backfill Script** - Fix existing campaign metrics
3. **Enable Auto-Refresh** - Turn on in reports dashboard
4. **Monitor Results** - Check delivery rates improve over time

---

**Version**: 1.0  
**Last Updated**: December 24, 2025  
**Status**: ✅ Production Ready
