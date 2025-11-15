# Shopify Webhook Integration Setup

## Environment Variables

Add these to your `.env.local` file:

```bash
# Shopify Configuration
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret_here
NEXT_PUBLIC_APP_URL=https://your-domain.com

# For Production
# NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

## Webhook Endpoints

### 1. Webhook Receiver
**Endpoint:** `POST /api/webhooks/shopify`
- Receives real-time updates from Shopify
- Handles: customers/create, customers/update, customers/delete
- Verifies HMAC signature for security

### 2. Webhook Management
**Endpoint:** `POST /api/integrations/shopify/webhooks`
- Registers webhooks with Shopify
- Returns list of registered webhooks

**Endpoint:** `GET /api/integrations/shopify/webhooks?store=...&apiKey=...`
- Lists all registered webhooks

**Endpoint:** `DELETE /api/integrations/shopify/webhooks?store=...&apiKey=...&webhookId=...`
- Deletes a specific webhook

## Setup Instructions

### 1. Get Shopify Credentials

1. Log in to your Shopify Admin Panel
2. Go to **Settings → Apps and sales channels → Develop apps**
3. Click **Create an app**
4. Name it (e.g., "CallMaker24 Integration")
5. Go to **Configuration → Admin API integration**
6. Configure scopes:
   - `read_customers`
   - `write_customers`
7. Install the app
8. Copy the **Admin API access token**

### 2. Configure Webhooks in the App

1. Navigate to `/dashboard/customers`
2. Click **"Sync Shopify"** button
3. Enter your store URL (e.g., `your-store.myshopify.com`)
4. Enter your Admin API access token
5. Click **"Enable Real-time Sync"** button
6. Webhooks will be automatically registered

### 3. Webhook Events

The integration handles these Shopify events:

#### customers/create
- Triggered when a new customer is created in Shopify
- Automatically adds customer to CallMaker24 database
- Includes: name, email, phone, tags, marketing preferences

#### customers/update
- Triggered when customer information is updated
- Syncs changes to CallMaker24 database
- Updates: contact info, tags, order count, total spend

#### customers/delete
- Triggered when a customer is deleted from Shopify
- Removes customer from CallMaker24 database

## Security Features

### HMAC Verification
All incoming webhooks are verified using HMAC SHA-256 signature to ensure they come from Shopify.

```typescript
const hash = crypto
  .createHmac('sha256', webhookSecret)
  .update(body, 'utf8')
  .digest('base64');
```

### Headers Verified
- `x-shopify-hmac-sha256`: Webhook signature
- `x-shopify-shop-domain`: Store domain
- `x-shopify-topic`: Event type

## Testing Webhooks

### Local Development with ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start your dev server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```
6. Register webhooks using the UI
7. Test by creating/updating customers in Shopify Admin

### Testing with Shopify CLI

```bash
shopify webhook trigger customers/create
shopify webhook trigger customers/update
shopify webhook trigger customers/delete
```

## Webhook Data Format

### customers/create Example
```json
{
  "id": 706405506930370084,
  "email": "customer@example.com",
  "accepts_marketing": true,
  "created_at": "2024-11-14T10:30:00-05:00",
  "updated_at": "2024-11-14T10:30:00-05:00",
  "first_name": "John",
  "last_name": "Smith",
  "orders_count": 0,
  "state": "enabled",
  "total_spent": "0.00",
  "phone": "+1234567890",
  "tags": "VIP, Newsletter",
  "currency": "USD"
}
```

## Production Deployment

### Vercel
1. Add environment variables in Vercel dashboard
2. Deploy your app
3. Use production URL for webhooks
4. Register webhooks through the UI

### Other Platforms
1. Ensure your domain supports HTTPS
2. Set `NEXT_PUBLIC_APP_URL` to your domain
3. Configure `SHOPIFY_WEBHOOK_SECRET`
4. Deploy and register webhooks

## Monitoring

Check webhook activity:
- Shopify Admin → Settings → Notifications → Webhooks
- View delivery status and error logs
- Retry failed deliveries manually

## Troubleshooting

### Webhooks not receiving
- Check `NEXT_PUBLIC_APP_URL` is correct
- Verify webhook is registered in Shopify Admin
- Check firewall/security settings
- Ensure HTTPS is enabled

### Signature verification failed
- Verify `SHOPIFY_WEBHOOK_SECRET` matches Shopify settings
- Check webhook secret in Shopify Admin → Apps → Your App

### Data not syncing
- Check server logs for errors
- Verify customer API endpoints are working
- Test manual sync first

## Benefits of Webhooks

✅ **Real-time sync** - Instant updates when customers change
✅ **Reduced API calls** - No polling needed
✅ **Lower latency** - Changes appear immediately
✅ **Automatic updates** - No manual intervention
✅ **Cost effective** - Only pay for actual events
✅ **Reliable** - Shopify retries failed deliveries

## API Rate Limits

Webhooks don't count against Shopify API rate limits, making them ideal for high-volume stores.
