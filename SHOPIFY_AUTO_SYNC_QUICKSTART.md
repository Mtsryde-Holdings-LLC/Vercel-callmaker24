# Quick Setup: Shopify Auto-Sync

## ⚡ Fast Setup (5 minutes)

### 1. Add Environment Variables

```bash
# In Vercel Dashboard or .env.local
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
CRON_SECRET=your_random_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Deploy

```bash
vercel --prod
```

Or push to GitHub if auto-deploy is enabled.

### 3. Register Webhooks

Option A: Use the app UI

- Go to `/dashboard/customers`
- Click "Enable Real-time Sync"

Option B: Manually in Shopify Admin

- Settings → Notifications → Webhooks
- Add webhook: `https://your-domain.com/api/webhooks/shopify`
- Events: `customers/create`, `customers/update`, `customers/delete`

### 4. Done! ✅

- Customers sync automatically every hour
- Webhooks sync changes in real-time
- Data persists in database permanently

## 🧪 Test It

### Test Persistence

1. Sync customers from Shopify integration page
2. Log out
3. Log back in
4. Customers are still there! ✅

### Test Cron Job

```bash
curl https://your-domain.com/api/cron/shopify-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Webhook

1. Create a customer in Shopify
2. Check your app's customer list
3. Customer appears instantly! ✅

## 📊 Monitor

### Vercel Dashboard

- Deployments → Functions → `api/cron/shopify-sync`
- View execution logs

### Database

```sql
SELECT name, platform, "lastSyncAt", "isActive"
FROM integrations
WHERE platform = 'SHOPIFY';
```

## 📚 Full Documentation

See [SHOPIFY_AUTO_SYNC_GUIDE.md](./SHOPIFY_AUTO_SYNC_GUIDE.md) for complete details.

## 🔧 Troubleshooting

**Cron not running?**

- Check Vercel plan supports cron jobs
- Verify `vercel.json` is deployed

**Webhooks not working?**

- Verify `SHOPIFY_WEBHOOK_SECRET` matches Shopify
- Check webhook URL is publicly accessible

**Customers not persisting?**

- Check integration `lastSyncAt` is updating
- Verify database connection

## ✨ What You Get

✅ No manual syncing after login  
✅ Automatic hourly background sync  
✅ Real-time webhook updates  
✅ Data persists permanently  
✅ Efficient incremental sync  
✅ Multi-organization support

---

**Need help?** Check the comprehensive guide: [SHOPIFY_AUTO_SYNC_GUIDE.md](./SHOPIFY_AUTO_SYNC_GUIDE.md)
