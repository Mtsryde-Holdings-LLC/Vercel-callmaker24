# CallMaker24 - Required APIs and Webhooks

## 🔑 Core Authentication & Security

### 1. **NextAuth.js**
- **Purpose**: User authentication and session management
- **Required Variables**:
  - `NEXTAUTH_URL` - Your application URL (e.g., https://callmaker24.com)
  - `NEXTAUTH_SECRET` - Secret key for JWT encryption (generate with: `openssl rand -base64 32`)
  - `SUPER_ADMIN_CODE` - Verification code for super admin access ✅ **CONFIGURED**
- **Status**: ✅ **ACTIVE**

### 2. **Database (PostgreSQL)**
- **Provider**: Railway PostgreSQL
- **Required Variables**:
  - `DATABASE_URL` - PostgreSQL connection string ✅ **CONFIGURED**
  - `DIRECT_URL` - Direct database connection (for migrations)
- **Status**: ✅ **ACTIVE**

---

## 📧 Email Services (Choose One)

### Option 1: **AWS SES** (Recommended for Production)
- **Purpose**: Send email campaigns and transactional emails
- **Required Variables**:
  ```
  AWS_REGION=us-east-1
  AWS_ACCESS_KEY_ID=your-aws-access-key-id
  AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
  AWS_SES_FROM_EMAIL=noreply@callmaker24.com
  ```
- **Setup Steps**:
  1. Create AWS account at https://aws.amazon.com
  2. Go to AWS SES Console
  3. Verify your domain (callmaker24.com)
  4. Create IAM user with SES send permissions
  5. Generate access keys
- **Pricing**: $0.10 per 1,000 emails
- **Status**: ⏳ **PENDING SETUP**

### Option 2: **Resend** (Easier Alternative)
- **Purpose**: Modern email API
- **Required Variables**:
  ```
  RESEND_API_KEY=re_your_resend_api_key
  EMAIL_FROM=noreply@callmaker24.com
  ```
- **Setup Steps**:
  1. Sign up at https://resend.com
  2. Verify your domain
  3. Generate API key
- **Pricing**: 100 emails/day free, then $20/month for 50k emails
- **Status**: ⏳ **PENDING SETUP**

### Option 3: **SendGrid**
- **Purpose**: Popular email delivery service
- **Required Variables**:
  ```
  SENDGRID_API_KEY=SG.your_sendgrid_api_key
  SENDGRID_FROM_EMAIL=noreply@callmaker24.com
  ```
- **Setup Steps**:
  1. Sign up at https://sendgrid.com
  2. Verify domain and sender identity
  3. Create API key with Full Access
- **Pricing**: 100 emails/day free, then $19.95/month for 50k emails
- **Status**: ⏳ **PENDING SETUP**

### Option 4: **Mailgun** (Developer Friendly)
- **Purpose**: Powerful email API with great deliverability
- **Required Variables**:
  ```
  MAILGUN_API_KEY=your-mailgun-api-key
  MAILGUN_DOMAIN=mg.callmaker24.com
  MAILGUN_REGION=us
  EMAIL_FROM=noreply@callmaker24.com
  ```
- **Setup Steps**:
  1. Sign up at https://mailgun.com
  2. Add and verify your domain
  3. Get API key from Settings → API Security
  4. Choose region (US or EU)
  5. Configure DNS records (SPF, DKIM, CNAME)
- **Pricing**: 
  - Free tier: 5,000 emails/month for 3 months
  - Pay as you go: $0.80 per 1,000 emails
  - Foundation: $35/month for 50,000 emails
- **Webhook Support**: Built-in tracking for opens, clicks, bounces
- **Status**: ⏳ **PENDING SETUP**

### **Email Webhook** (For delivery tracking)
- **Endpoint**: `https://callmaker24.com/api/webhooks/email`
- **Events Tracked**: delivered, opened, clicked, bounced, spam_report, failed
- **Configure In**: 
  - SendGrid: Settings → Mail Settings → Event Webhook
  - Mailgun: Settings → Webhooks → Add webhook URL

---

## 📱 SMS & Voice Services

### **Twilio** (Required)
- **Purpose**: Send SMS campaigns and handle voice calls
- **Required Variables**:
  ```
  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_AUTH_TOKEN=your_twilio_auth_token
  TWILIO_PHONE_NUMBER=+1234567890
  TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_API_SECRET=your_twilio_api_secret
  ```
- **Setup Steps**:
  1. Sign up at https://twilio.com
  2. Buy a phone number (or use free trial number)
  3. Get Account SID and Auth Token from console
  4. Create Messaging Service (optional, for better deliverability)
  5. Create TwiML App for voice calls
  6. Generate API Key for programmable access
- **Pricing**: 
  - SMS: $0.0079 per message (US)
  - Voice: $0.013 per minute (US)
- **Status**: ⏳ **PENDING SETUP**

### **SMS Webhooks**
1. **Incoming SMS Webhook**
   - **Endpoint**: `https://callmaker24.com/api/webhooks/sms`
   - **Purpose**: Receive replies from customers
   - **Configure In**: Twilio → Phone Numbers → Your Number → Messaging → Webhook URL

2. **SMS Status Webhook**
   - **Endpoint**: `https://callmaker24.com/api/webhooks/sms/status`
   - **Purpose**: Track delivery status (sent, delivered, failed)
   - **Configure In**: Twilio → Messaging Services → Status Callback URL

### **Voice Webhooks**
- **Voice Status Webhook**
  - **Endpoint**: `https://callmaker24.com/api/webhooks/voice/status`
  - **Purpose**: Track call status (initiated, ringing, answered, completed)
  - **Configure In**: Twilio → Phone Numbers → Your Number → Voice → Status Callback URL

---

## 🤖 AI Services

### **OpenAI** (Required for AI features)
- **Purpose**: Generate email content, captions, chatbot responses
- **Required Variables**:
  ```
  OPENAI_API_KEY=sk-your-openai-api-key
  OPENAI_MODEL=gpt-4-turbo-preview
  OPENAI_MAX_TOKENS=2000
  ```
- **Setup Steps**:
  1. Sign up at https://platform.openai.com
  2. Add payment method (required after free credits)
  3. Create API key at https://platform.openai.com/api-keys
- **Pricing**: 
  - GPT-4 Turbo: $0.01 per 1K tokens (~$0.03 per email generation)
  - GPT-3.5 Turbo: $0.0015 per 1K tokens (cheaper alternative)
- **Status**: ⏳ **PENDING SETUP**

---

## 🌐 Social Media APIs

### 1. **Facebook/Instagram (Meta Business)**
- **Purpose**: Post to Facebook and Instagram, manage business pages
- **Required Variables**:
  ```
  FACEBOOK_APP_ID=your-facebook-app-id
  FACEBOOK_APP_SECRET=your-facebook-app-secret
  FACEBOOK_CLIENT_ID=your-facebook-client-id
  FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
  ```
- **Setup Steps**:
  1. Create Meta Developer account at https://developers.facebook.com
  2. Create new app → Type: Business
  3. Add Facebook Login and Instagram Graph API products
  4. Configure OAuth redirect: `https://callmaker24.com/api/social/oauth/callback/facebook`
  5. Get App ID and App Secret from Settings → Basic
  6. Submit for App Review (required for public access)
- **Permissions Needed**:
  - `pages_manage_posts` - Post to Facebook Pages
  - `instagram_basic` - Access Instagram account
  - `instagram_content_publish` - Post to Instagram
  - `pages_read_engagement` - Read page analytics
- **Status**: ⏳ **PENDING SETUP**

### **Facebook Webhook**
- **Endpoint**: `https://callmaker24.com/api/webhooks/facebook`
- **Purpose**: Receive notifications about comments, mentions, messages
- **Configure In**: Meta Developer Console → Webhooks → Page Subscriptions

### 2. **Twitter/X**
- **Purpose**: Post tweets and manage Twitter account
- **Required Variables**:
  ```
  TWITTER_CLIENT_ID=your-twitter-client-id
  TWITTER_CLIENT_SECRET=your-twitter-client-secret
  TWITTER_BEARER_TOKEN=your-twitter-bearer-token
  ```
- **Setup Steps**:
  1. Apply for Developer account at https://developer.twitter.com
  2. Create new app in Developer Portal
  3. Enable OAuth 2.0 with PKCE
  4. Add callback URL: `https://callmaker24.com/api/social/oauth/callback/twitter`
  5. Generate Bearer Token for API v2 access
- **Pricing**: 
  - Free tier: 1,500 tweets/month
  - Basic: $100/month for 3,000 tweets/month
- **Status**: ⏳ **PENDING SETUP**

### **Twitter Webhook**
- **Endpoint**: `https://callmaker24.com/api/webhooks/twitter`
- **Purpose**: Receive mentions, DMs, engagement events
- **Note**: Requires Twitter API Premium or Enterprise plan

### 3. **LinkedIn**
- **Purpose**: Share posts on LinkedIn company pages
- **Required Variables**:
  ```
  LINKEDIN_CLIENT_ID=your-linkedin-client-id
  LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
  ```
- **Setup Steps**:
  1. Create LinkedIn app at https://www.linkedin.com/developers/apps
  2. Add OAuth 2.0 redirect URL: `https://callmaker24.com/api/social/oauth/callback/linkedin`
  3. Request API access for Marketing Developer Platform
  4. Get Client ID and Secret from Auth tab
- **Permissions Needed**:
  - `w_member_social` - Post on behalf of member
  - `w_organization_social` - Post on company pages
- **Status**: ⏳ **PENDING SETUP**

### 4. **TikTok**
- **Purpose**: Post videos to TikTok business account
- **Required Variables**:
  ```
  TIKTOK_CLIENT_KEY=your-tiktok-client-key
  TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
  ```
- **Setup Steps**:
  1. Create TikTok Developer account at https://developers.tiktok.com
  2. Create new app → Business category
  3. Add OAuth redirect: `https://callmaker24.com/api/social/oauth/callback/tiktok`
  4. Apply for Content Posting API access
- **Note**: Requires TikTok Business account and API approval
- **Status**: ⏳ **PENDING SETUP**

---

## 💳 Payment Processing

### **Stripe** (Required for subscriptions)
- **Purpose**: Handle subscription payments and billing
- **Required Variables**:
  ```
  STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
  STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
  STRIPE_PRICE_ID_BASIC=price_basic_monthly
  STRIPE_PRICE_ID_PRO=price_pro_monthly
  STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_monthly
  ```
- **Setup Steps**:
  1. Create Stripe account at https://stripe.com
  2. Get API keys from Developers → API keys
  3. Create products and prices in Products section
  4. Set up webhook endpoint (see below)
  5. Enable Customer Portal for subscription management
- **Pricing**: 2.9% + $0.30 per transaction
- **Status**: ⏳ **PENDING SETUP**

### **Stripe Webhook** (Critical)
- **Endpoint**: `https://callmaker24.com/api/webhooks/stripe`
- **Events to Listen For**:
  - `checkout.session.completed` - New subscription
  - `customer.subscription.updated` - Plan change
  - `customer.subscription.deleted` - Cancellation
  - `invoice.payment_succeeded` - Successful payment
  - `invoice.payment_failed` - Failed payment
- **Configure In**: Stripe Dashboard → Developers → Webhooks → Add endpoint

---

## 🛍️ E-commerce Integrations (Optional)

### **Shopify**
- **Purpose**: Import products for social media content generation
- **Required Variables**:
  ```
  SHOPIFY_API_KEY=your_shopify_api_key
  SHOPIFY_API_SECRET=your_shopify_api_secret
  ```
- **Setup Steps**:
  1. Create Shopify Partner account at https://partners.shopify.com
  2. Create custom app in partner dashboard
  3. Configure scopes: `read_products`, `read_orders`, `read_customers`
  4. Install app on user's store
- **Status**: ⏳ **OPTIONAL - NOT REQUIRED**

### **Shopify Webhook**
- **Endpoint**: `https://callmaker24.com/api/webhooks/shopify`
- **Purpose**: Sync products, orders, and customer data
- **Events**: `products/create`, `products/update`, `orders/create`

---

## 📦 File Storage

### **Vercel Blob Storage** (Recommended)
- **Purpose**: Store uploaded images, videos, customer imports
- **Required Variables**:
  ```
  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token
  ```
- **Setup Steps**:
  1. Go to Vercel Dashboard → Your Project → Storage
  2. Create Blob Store
  3. Copy the token to environment variables
- **Pricing**: 1GB free, then $0.15 per GB
- **Status**: ⏳ **PENDING SETUP**

### **Cloudinary** (Alternative)
- **Purpose**: Image/video optimization and CDN
- **Required Variables**:
  ```
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```
- **Setup**: Sign up at https://cloudinary.com
- **Pricing**: 25GB free, then $0.024 per GB
- **Status**: ⏳ **OPTIONAL ALTERNATIVE**

---

## 🔐 OAuth Providers (For User Sign-in)

### **Google OAuth**
- **Purpose**: Allow users to sign in with Google
- **Required Variables**:
  ```
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret
  ```
- **Setup Steps**:
  1. Go to https://console.cloud.google.com
  2. Create new project
  3. Enable Google+ API
  4. Create OAuth 2.0 credentials
  5. Add authorized redirect URI: `https://callmaker24.com/api/auth/callback/google`
- **Status**: ⏳ **PENDING SETUP**

### **Facebook OAuth** (Separate from Business API)
- **Purpose**: Allow users to sign in with Facebook
- **Already configured** under Facebook App ID above
- **Status**: ⏳ **PENDING SETUP**

---

## 📊 Monitoring & Analytics (Optional but Recommended)

### **Sentry** (Error Tracking)
- **Purpose**: Track and debug production errors
- **Required Variables**:
  ```
  SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
  ```
- **Setup**: Sign up at https://sentry.io
- **Pricing**: Free for 5k events/month
- **Status**: ⏳ **OPTIONAL**

### **LogTail** (Application Logs)
- **Purpose**: Centralized logging
- **Required Variables**:
  ```
  LOGTAIL_SOURCE_TOKEN=your_logtail_token
  ```
- **Setup**: Sign up at https://logtail.com
- **Status**: ⏳ **OPTIONAL**

---

## 🗄️ Caching (Optional but Recommended)

### **Upstash Redis**
- **Purpose**: Cache API responses, rate limiting, session storage
- **Required Variables**:
  ```
  UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
  UPSTASH_REDIS_REST_TOKEN=your_redis_token
  ```
- **Setup**: Sign up at https://upstash.com
- **Pricing**: 10k commands/day free
- **Status**: ⏳ **OPTIONAL**

---

## 🔔 Notifications (Optional)

### **Slack Webhook**
- **Purpose**: Send alerts to Slack channel (failed payments, errors, etc.)
- **Required Variables**:
  ```
  SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
  ```
- **Setup**: Create incoming webhook in Slack workspace settings
- **Status**: ⏳ **OPTIONAL**

---

## 📋 Priority Setup Checklist

### **CRITICAL (Required for Core Functionality)**
1. ✅ Database (PostgreSQL) - **ACTIVE**
2. ✅ NextAuth.js + Super Admin Code - **ACTIVE**
3. ⏳ Email Service (AWS SES, Resend, or SendGrid) - **CHOOSE ONE**
4. ⏳ Twilio (SMS & Voice) - **REQUIRED**
5. ⏳ Stripe (Payments & Subscriptions) - **REQUIRED**
6. ⏳ File Storage (Vercel Blob) - **RECOMMENDED**

### **HIGH PRIORITY (For Main Features)**
7. ⏳ OpenAI API (AI Content Generation) - **RECOMMENDED**
8. ⏳ Google OAuth (User Sign-in) - **RECOMMENDED**
9. ⏳ Facebook Business API (Social Media) - **NEEDED FOR SOCIAL FEATURES**

### **MEDIUM PRIORITY (Enhanced Features)**
10. ⏳ Twitter API (Social Media)
11. ⏳ LinkedIn API (Social Media)
12. ⏳ Instagram API (via Facebook)
13. ⏳ Email Webhook (Delivery Tracking)
14. ⏳ SMS Webhooks (Status Tracking)

### **LOW PRIORITY (Optional Enhancements)**
15. ⏳ TikTok API
16. ⏳ Shopify Integration
17. ⏳ Sentry (Error Monitoring)
18. ⏳ Upstash Redis (Caching)
19. ⏳ Slack Notifications

---

## 🌐 Webhook URLs Summary

Configure these URLs in respective service dashboards:

| Service | Webhook URL | Purpose |
|---------|------------|---------|
| **Stripe** | `https://callmaker24.com/api/webhooks/stripe` | Payment events |
| **Twilio SMS** | `https://callmaker24.com/api/webhooks/sms` | Incoming SMS |
| **Twilio SMS Status** | `https://callmaker24.com/api/webhooks/sms/status` | Delivery status |
| **Twilio Voice** | `https://callmaker24.com/api/webhooks/voice/status` | Call status |
| **SendGrid** | `https://callmaker24.com/api/webhooks/email` | Email events |
| **Facebook** | `https://callmaker24.com/api/webhooks/facebook` | Page events |
| **Twitter** | `https://callmaker24.com/api/webhooks/twitter` | Mention events |
| **Shopify** | `https://callmaker24.com/api/webhooks/shopify` | Product sync |

---

## 💰 Estimated Monthly Costs

**Minimum (Basic Setup)**
- Database (Railway): $5/month
- Vercel Hosting: $20/month (Pro plan)
- Email (Resend): $20/month (50k emails)
- SMS (Twilio): ~$50/month (5k SMS)
- Stripe: 2.9% + $0.30 per transaction
- **Total: ~$95/month + transaction fees**

**Recommended (Full Features)**
- Add OpenAI: ~$30/month (AI content)
- Add File Storage: ~$10/month (Vercel Blob)
- Add Social Media APIs: $0-100/month (Twitter)
- **Total: ~$135-235/month + transaction fees**

---

## 📝 Next Steps

1. **Immediate**: Set up email service (Resend is easiest to start)
2. **Week 1**: Configure Twilio for SMS/voice
3. **Week 1**: Set up Stripe for payments
4. **Week 2**: Add OpenAI for AI features
5. **Week 2**: Configure social media APIs (start with Facebook)
6. **Week 3**: Set up all webhooks for event tracking
7. **Week 4**: Add monitoring and optional services

---

## 🆘 Support & Resources

- **Twilio Docs**: https://www.twilio.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **Meta Business**: https://developers.facebook.com/docs
- **Twitter API**: https://developer.twitter.com/en/docs
- **NextAuth.js**: https://next-auth.js.org

---

*Last Updated: November 17, 2025*
