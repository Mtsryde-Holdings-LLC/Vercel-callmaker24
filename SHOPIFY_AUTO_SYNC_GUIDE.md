# Shopify Auto-Sync Setup Guide

## Overview

The Shopify integration now automatically syncs and persists customer data in your app database. No more manual syncing after every login!

## Features

### 1. **Automatic Background Sync (Cron Job)**

- Runs every hour automatically
- Syncs new and updated customers from all connected Shopify stores
- Uses incremental sync (only fetches customers updated since last sync)
- Prevents redundant syncing (skips if synced within last 30 minutes)

### 2. **Real-time Webhook Sync**

- Instantly syncs when customers are created/updated/deleted in Shopify
- No delays - changes appear immediately in your app
- Handles edge cases and duplicate prevention

### 3. **Smart Incremental Sync**

- Tracks last sync time per organization
- Only fetches customers changed since last sync
- Reduces API calls and improves performance

## Setup Instructions

### Step 1: Configure Environment Variables

Add to your `.env.local` or Vercel environment variables:

```bash
# Required for webhook verification
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here

# Optional: Protect cron endpoint from unauthorized access
CRON_SECRET=your_random_secret_here

# Your app URL (for webhooks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 2: Enable Webhooks in Shopify

1. Go to your Shopify Admin
2. Navigate to **Settings → Notifications → Webhooks**
3. Add these webhooks:
   - **Event:** customers/create → **URL:** `https://your-domain.com/api/webhooks/shopify`
   - **Event:** customers/update → **URL:** `https://your-domain.com/api/webhooks/shopify`
   - **Event:** customers/delete → **URL:** `https://your-domain.com/api/webhooks/shopify`

Or use the UI in your app at `/dashboard/customers` → Click "Enable Real-time Sync"

### Step 3: Verify Cron Job Configuration

The cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/shopify-sync",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour at the top of the hour (12:00, 1:00, 2:00, etc.)

### Step 4: Deploy to Vercel

Deploy your app and the cron job will automatically activate:

```bash
vercel --prod
```

Or push to your connected GitHub repository for automatic deployment.

## How It Works

### Initial Sync

When you first connect a Shopify store:

1. Click "Sync Shopify" in the customers page
2. All customers are fetched and stored in your database
3. Integration record is created with `lastSyncAt` timestamp

### Automatic Updates

After initial sync, customers are automatically updated via:

#### Hourly Cron Job

- Checks all active Shopify integrations
- Fetches only customers updated since `lastSyncAt`
- Upserts customers in database
- Updates `lastSyncAt` timestamp

#### Real-time Webhooks

- Shopify sends webhook when customer is created/updated/deleted
- App verifies webhook signature for security
- Immediately creates/updates customer in database
- Handles duplicates and edge cases

### Data Persistence

All customer data is now **permanently stored** in your database:

- ✅ Shopify ID
- ✅ Email, phone, name
- ✅ Total spent, order count
- ✅ Marketing preferences
- ✅ Address and company info
- ✅ Source tracking (SHOPIFY)

## API Endpoints

### Manual Sync

```http
POST /api/integrations/shopify/sync
Content-Type: application/json

{
  "organizationId": "org_123",
  "shop": "your-store.myshopify.com",
  "accessToken": "shpat_xxx"
}
```

### Cron Job (Auto-sync)

```http
GET /api/cron/shopify-sync
Authorization: Bearer YOUR_CRON_SECRET
```

### Webhook Receiver

```http
POST /api/webhooks/shopify
X-Shopify-Hmac-Sha256: [signature]
X-Shopify-Shop-Domain: your-store.myshopify.com
X-Shopify-Topic: customers/create

[customer data]
```

## Testing

### Test Cron Job Locally

```bash
curl http://localhost:3000/api/cron/shopify-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Webhook Locally (with ngrok)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Use ngrok URL in Shopify webhook settings
```

### Verify Data Persistence

1. Create a customer in Shopify
2. Check webhook logs: `[Shopify Customer Webhook] Customer created`
3. Verify in database or customers page
4. Log out and log back in
5. Customer should still be there! ✅

## Monitoring

### Check Sync Status

View integration `lastSyncAt` in database:

```sql
SELECT name, platform, "lastSyncAt", "isActive"
FROM integrations
WHERE platform = 'SHOPIFY';
```

### View Cron Logs

In Vercel Dashboard:

1. Go to your project
2. Click "Deployments" → Select deployment
3. Click "Functions" → Find `api/cron/shopify-sync`
4. View logs

### Webhook Logs

Check your application logs for:

- `[Shopify Customer Webhook] Received customers/create`
- `[Shopify Customer Webhook] Customer created`
- `[SHOPIFY CRON] Syncing customers for...`

## Troubleshooting

### Customers Not Syncing

1. Check webhook is registered in Shopify
2. Verify `SHOPIFY_WEBHOOK_SECRET` matches Shopify
3. Check webhook signature verification in logs
4. Ensure integration is marked `isActive: true`

### Cron Not Running

1. Verify `vercel.json` is deployed
2. Check Vercel dashboard → Settings → Crons
3. Ensure you're on a plan that supports crons
4. Check function logs for errors

### Duplicate Customers

- The system prevents duplicates using `shopifyId_organizationId` unique constraint
- Webhooks have idempotency checks
- If duplicate occurs, it updates instead of creating

## Benefits

✅ **No More Manual Syncing** - Set it and forget it  
✅ **Real-time Updates** - Webhooks sync instantly  
✅ **Data Persistence** - Customers stay in DB permanently  
✅ **Performance** - Incremental sync reduces API calls  
✅ **Reliability** - Dual sync system (webhooks + cron)  
✅ **Scalability** - Handles multiple organizations

## Support

If you encounter issues:

1. Check logs in Vercel dashboard
2. Verify environment variables are set
3. Test webhook signature verification
4. Ensure Shopify API credentials are valid
5. Check database for integration records

For more information, see:

- [SHOPIFY_WEBHOOKS.md](./SHOPIFY_WEBHOOKS.md)
- [AWS_CONNECT_SETUP.md](./AWS_CONNECT_SETUP.md)
