# Shopify Auto-Sync Implementation Summary

## Problem Solved

✅ **Before:** Customer data required manual sync after every login  
✅ **After:** Customers are automatically synced and permanently stored in database

## Changes Made

### 1. Created Automatic Background Sync Cron Job

**File:** `src/app/api/cron/shopify-sync/route.ts`

- Runs every hour automatically (configured in `vercel.json`)
- Syncs all active Shopify integrations
- Only fetches customers updated since last sync (incremental sync)
- Prevents redundant syncing (skips if synced within 30 minutes)
- Updates `Integration.lastSyncAt` timestamp after each sync
- Handles multiple organizations in one run

**Key Features:**

- Protected by `CRON_SECRET` authorization
- Comprehensive error handling per integration
- Detailed logging for monitoring
- Returns sync results for all integrations

### 2. Enhanced Webhook Handler

**File:** `src/app/api/webhooks/shopify/route.ts`

**Improvements:**

- Fixed `handleCustomerDelete()` to use `status: 'INACTIVE'` instead of non-existent `deletedAt` field
- Enhanced `handleCustomerCreate()` to find admin user from organization
- Better error handling with idempotency checks
- Improved logging for troubleshooting
- Added proper address building from Shopify data

**Changes:**

- Webhook now finds the first available admin (CORPORATE_ADMIN, SUPER_ADMIN, or SUB_ADMIN) from the organization
- Creates customers with `notes` field indicating auto-sync source
- Properly handles duplicate prevention with unique constraint error handling

### 3. Updated Manual Sync Endpoint

**File:** `src/app/api/integrations/shopify/sync/route.ts`

**Added:**

- Integration lookup to get `lastSyncAt` timestamp
- Incremental sync using `updated_at_min` Shopify filter
- Integration record upsert after successful sync
- Updates `lastSyncAt` timestamp on every sync
- Creates integration record if it doesn't exist

**Changes:**

- Now uses `URLSearchParams` for cleaner URL building
- Passes `updated_at_min` to Shopify API for incremental sync
- Creates/updates integration record with credentials

### 4. Updated Cron Configuration

**File:** `vercel.json`

**Changed:**

- Updated cron path from `/api/cron/sync-shopify` to `/api/cron/shopify-sync`
- Schedule remains: `0 * * * *` (every hour at :00)

### 5. Created Documentation

**New Files:**

- `SHOPIFY_AUTO_SYNC_GUIDE.md` - Comprehensive setup and usage guide
- This summary document

**Updated Files:**

- `SHOPIFY_WEBHOOKS.md` - Added reference to auto-sync feature

## Database Schema (Already Exists)

The solution uses existing schema fields:

- `Integration.lastSyncAt` - Tracks last successful sync timestamp
- `Customer.shopifyId` - Links customer to Shopify
- `Customer.source` - Marks origin as 'SHOPIFY'
- `Customer.organizationId` - Multi-tenant support

Unique constraint: `@@unique([shopifyId, organizationId])`

## How It Works

### Initial Setup

1. User connects Shopify store (one-time)
2. User clicks "Sync Shopify" for initial sync
3. All customers are fetched and stored
4. `Integration.lastSyncAt` is set

### Ongoing Automatic Sync

#### Method 1: Hourly Cron Job

```
Every hour at :00:
├─ Vercel Cron triggers /api/cron/shopify-sync
├─ Finds all active Shopify integrations
├─ For each integration:
│  ├─ Check if lastSyncAt > 30 min ago (skip if yes)
│  ├─ Fetch customers updated since lastSyncAt
│  ├─ Upsert customers in database
│  └─ Update lastSyncAt timestamp
└─ Return sync results
```

#### Method 2: Real-time Webhooks

```
Customer created/updated in Shopify:
├─ Shopify sends POST to /api/webhooks/shopify
├─ Verify HMAC signature
├─ Find integration by shop domain
├─ Find admin user from organization
├─ Upsert customer in database
└─ Return success
```

### Incremental Sync Logic

```typescript
// Only fetch customers updated since last sync
const updatedSince = integration.lastSyncAt?.toISOString();
const url = `https://${shop}/admin/api/2024-01/customers.json?limit=250&updated_at_min=${updatedSince}`;
```

## API Endpoints

### New Endpoint

- `GET /api/cron/shopify-sync` - Automatic background sync (cron)

### Existing Endpoints (Enhanced)

- `POST /api/integrations/shopify/sync` - Manual sync (now incremental)
- `POST /api/webhooks/shopify` - Real-time webhook receiver (improved)

## Environment Variables Required

```bash
# Required
SHOPIFY_WEBHOOK_SECRET=xxx        # For webhook verification
NEXT_PUBLIC_APP_URL=xxx           # For webhook URLs

# Optional
CRON_SECRET=xxx                   # Protect cron endpoint
```

## Testing

### Test Cron Job

```bash
curl http://localhost:3000/api/cron/shopify-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Data Persistence

1. Sync customers from Shopify
2. Log out of the app
3. Log back in
4. Verify customers are still there ✅

### Test Real-time Sync

1. Create customer in Shopify Admin
2. Check app customers page - should appear instantly
3. Or check logs: `[Shopify Customer Webhook] Customer created`

## Benefits

✅ **No Manual Sync Required** - Fully automated  
✅ **Data Persistence** - Customers stored permanently  
✅ **Real-time Updates** - Webhooks sync instantly  
✅ **Efficient** - Incremental sync reduces API calls  
✅ **Reliable** - Dual sync system (webhooks + cron as backup)  
✅ **Scalable** - Handles multiple organizations  
✅ **Secure** - HMAC verification + CRON_SECRET protection

## Deployment Checklist

- [ ] Set `SHOPIFY_WEBHOOK_SECRET` in Vercel environment variables
- [ ] Set `CRON_SECRET` in Vercel environment variables (optional but recommended)
- [ ] Deploy to Vercel (cron job activates automatically)
- [ ] Register webhooks in Shopify or via app UI
- [ ] Test initial sync from Shopify integration page
- [ ] Monitor first cron run (check Vercel function logs)
- [ ] Verify customers persist after logout/login

## Monitoring

### View Cron Logs (Vercel)

1. Vercel Dashboard → Your Project
2. Deployments → Latest Deployment
3. Functions → `api/cron/shopify-sync`
4. View execution logs

### View Webhook Logs

Check application logs for:

```
[Shopify Customer Webhook] Received customers/create from shop.myshopify.com
[Shopify Customer Webhook] Customer created: cus_xxx (email@example.com)
[SHOPIFY CRON] Starting automatic sync...
[SHOPIFY CRON] Synced 15 customers for shop.myshopify.com
```

### Check Sync Status (Database)

```sql
SELECT
  name,
  platform,
  "lastSyncAt",
  "isActive",
  "organizationId"
FROM integrations
WHERE platform = 'SHOPIFY';
```

## Troubleshooting

### Cron Not Running

- Check Vercel plan supports cron jobs
- Verify `vercel.json` is in repository root
- Check Vercel Dashboard → Settings → Cron Jobs
- View function logs for errors

### Customers Not Persisting

- Check `Integration.lastSyncAt` is being updated
- Verify `Customer.shopifyId` is set correctly
- Check for unique constraint violations in logs
- Ensure `organizationId` matches user's organization

### Webhook Not Working

- Verify `SHOPIFY_WEBHOOK_SECRET` matches Shopify
- Check webhook signature verification in logs
- Ensure webhook URL is publicly accessible
- Test with Shopify CLI: `shopify webhook trigger customers/create`

## Files Modified/Created

### Created

- ✨ `src/app/api/cron/shopify-sync/route.ts` (NEW)
- ✨ `SHOPIFY_AUTO_SYNC_GUIDE.md` (NEW)
- ✨ `SHOPIFY_AUTO_SYNC_SUMMARY.md` (NEW - this file)

### Modified

- ✏️ `src/app/api/integrations/shopify/sync/route.ts`
- ✏️ `src/app/api/webhooks/shopify/route.ts`
- ✏️ `vercel.json`
- ✏️ `SHOPIFY_WEBHOOKS.md`

### No Changes Needed

- ✅ `prisma/schema.prisma` (already has `lastSyncAt` field)
- ✅ Database migrations (no schema changes needed)

## Next Steps (Optional Enhancements)

1. **Add Sync Status UI**

   - Show last sync time in dashboard
   - Display sync progress/status
   - Add manual "Force Sync" button

2. **Add Order Auto-Sync**

   - Create `/api/cron/shopify-orders-sync`
   - Sync orders incrementally like customers

3. **Add Products Auto-Sync**

   - Create `/api/cron/shopify-products-sync`
   - Sync product catalog automatically

4. **Enhanced Monitoring**

   - Create admin dashboard for sync status
   - Send alerts on sync failures
   - Track sync performance metrics

5. **Webhook Health Check**
   - Verify webhooks are still registered
   - Auto-register if missing
   - Test webhook connectivity

## Conclusion

The Shopify integration now features:

- ✅ Automatic hourly background sync
- ✅ Real-time webhook sync
- ✅ Persistent customer data storage
- ✅ Incremental sync for performance
- ✅ Multi-organization support
- ✅ Comprehensive error handling

**No more manual syncing required!** Customers are automatically kept in sync with Shopify, both in real-time (webhooks) and periodically (cron job).
