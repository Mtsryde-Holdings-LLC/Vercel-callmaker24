# Deployment Guide

Complete guide for deploying the Email & SMS Marketing Platform to Vercel.

## Prerequisites

Before deploying, ensure you have:

- [x] GitHub account
- [x] Vercel account
- [x] Domain name (optional)
- [x] Required API keys:
  - Resend or SendGrid API key
  - Twilio Account SID and Auth Token
  - OpenAI API key
  - Stripe API keys
  - Google/Facebook OAuth credentials

## Step-by-Step Deployment

### 1. Prepare Your Code

#### Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Email & SMS Marketing Platform"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2. Set Up Database

#### Option A: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Note: Neon provides both pooled and direct connection strings

#### Option B: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (Transaction mode)
5. Also copy the direct connection string

#### Option C: PlanetScale

1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Create a branch (main)
4. Get connection strings

### 3. Configure Stripe

#### Create Products and Prices

```bash
# Install Stripe CLI
npm install -g stripe

# Login
stripe login

# Create products
stripe products create --name="Basic Plan" --description="Basic marketing features"
stripe products create --name="Pro Plan" --description="Advanced marketing automation"
stripe products create --name="Enterprise Plan" --description="Enterprise-grade features"

# Create prices (adjust amounts as needed)
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month

# Note the price IDs for your .env file
```

#### Set Up Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the webhook signing secret

### 4. Configure Twilio

#### Get Credentials

1. Go to [twilio.com/console](https://www.twilio.com/console)
2. Copy your Account SID and Auth Token
3. Buy a phone number (Phone Numbers → Buy a number)

#### Set Up Webhooks

1. Go to Phone Numbers → Manage → Active numbers
2. Click your number
3. Configure:
   - **SMS**: Webhook → `https://your-app.vercel.app/api/webhooks/twilio/sms`
   - **Voice**: Webhook → `https://your-app.vercel.app/api/voice/ivr`

### 5. Configure OAuth Providers

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth client ID
5. Application type: Web application
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://callmaker24.com/api/auth/callback/google` (prod)
7. Copy Client ID and Client Secret

#### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app
3. Add Facebook Login product
4. Configure Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://callmaker24.com/api/auth/callback/facebook`
5. Copy App ID and App Secret

### 6. Deploy to Vercel

#### Using Vercel Dashboard

1. **Import Project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Project**
   - Framework Preset: `Next.js`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**

   Click "Environment Variables" and add:

   ```env
   # Database
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   DIRECT_URL=postgresql://user:pass@host/db

   # NextAuth
   NEXTAUTH_URL=https://callmaker24.com
   NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

   # OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FACEBOOK_CLIENT_ID=your_facebook_app_id
   FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

   # Email
   RESEND_API_KEY=re_your_resend_api_key
   EMAIL_FROM=noreply@yourdomain.com

   # Twilio
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+1234567890

   # OpenAI
   OPENAI_API_KEY=sk-your-openai-api-key
   OPENAI_MODEL=gpt-4-turbo-preview

   # Stripe
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   STRIPE_PRICE_ID_BASIC=price_xxxxx
   STRIPE_PRICE_ID_PRO=price_xxxxx
   STRIPE_PRICE_ID_ENTERPRISE=price_xxxxx

   # Vercel Blob
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token

   # Feature Flags
   FEATURE_AI_ENABLED=true
   FEATURE_IVR_ENABLED=true
   FEATURE_TWO_FACTOR_AUTH=true
   ```

   **Important**: Add these for ALL environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)
   - Your app will be live at `https://your-app.vercel.app`

#### Using Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

### 7. Run Database Migrations

After first deployment:

```bash
# Install dependencies locally
npm install

# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npx prisma db push

# Or run migrations (for production)
npx prisma migrate deploy
```

Alternatively, use Vercel CLI:

```bash
vercel env pull .env
npm run prisma:push
```

### 8. Configure Custom Domain (Optional)

1. Go to your Vercel project
2. Settings → Domains
3. Add your domain
4. Configure DNS:
   - Type: `A` Record
   - Name: `@`
   - Value: `76.76.21.21`
   
   OR
   
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

5. Wait for DNS propagation (5-60 minutes)

### 9. Set Up CI/CD with GitHub Actions

The project includes a CI/CD pipeline (`.github/workflows/ci-cd.yml`).

Add these secrets to your GitHub repository:

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `VERCEL_TOKEN` - Get from Vercel Settings → Tokens
   - `VERCEL_ORG_ID` - Get from Vercel project settings
   - `VERCEL_PROJECT_ID` - Get from Vercel project settings
   - `TEST_DATABASE_URL` - Test database connection string
   - `PRODUCTION_URL` - Your production URL

### 10. Verify Deployment

#### Test Authentication
1. Visit `https://your-app.vercel.app`
2. Click "Sign In"
3. Test email/password login
4. Test Google OAuth
5. Test Facebook OAuth

#### Test Email Sending
1. Create a test customer
2. Create an email campaign
3. Send test email
4. Verify delivery in Resend/SendGrid dashboard

#### Test SMS
1. Send a test SMS campaign
2. Verify delivery in Twilio console
3. Test reply handling

#### Test AI Features
1. Use AI content generator
2. Verify OpenAI API calls in dashboard

#### Test Payments
1. Go to subscription page
2. Use Stripe test card: `4242 4242 4242 4242`
3. Verify subscription creation
4. Check Stripe dashboard

### 11. Monitoring & Maintenance

#### Enable Vercel Analytics

1. Project Settings → Analytics
2. Enable Vercel Analytics
3. View real-time metrics

#### Set Up Sentry (Error Tracking)

```bash
npm install @sentry/nextjs

npx @sentry/wizard -i nextjs
```

Add to `.env`:
```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### Configure Uptime Monitoring

Use services like:
- Uptime Robot (free)
- Better Uptime
- Pingdom

Monitor endpoints:
- `https://your-app.vercel.app/api/health`
- `https://your-app.vercel.app`

## Troubleshooting

### Build Failures

**Issue**: `Cannot find module 'prisma'`
**Solution**: 
```bash
npm run prisma:generate
```

**Issue**: TypeScript errors
**Solution**: 
```bash
npm run lint
npm run build
```

### Database Connection Issues

**Issue**: `Can't reach database server`
**Solution**: 
- Check DATABASE_URL format
- Verify database is accessible
- Check IP whitelist (if applicable)

### Environment Variable Issues

**Issue**: Variables not loading
**Solution**:
- Redeploy after adding env vars
- Check variable names (no typos)
- Verify all environments have variables

### Webhook Issues

**Issue**: Webhooks not receiving events
**Solution**:
- Verify webhook URLs are correct
- Check webhook secrets match
- Review webhook logs in provider dashboard

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] All environment variables set
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] OAuth providers tested
- [ ] Email sending tested
- [ ] SMS sending tested
- [ ] Payment flow tested
- [ ] Webhooks configured
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Documentation updated with production URLs

## Scaling Considerations

### Database Scaling

- Enable connection pooling
- Monitor query performance
- Add read replicas if needed
- Consider database sharding for multi-tenant

### API Scaling

- Implement rate limiting
- Use Redis for caching
- Enable CDN for static assets
- Optimize API queries

### Cost Optimization

- Monitor Vercel usage
- Track external API costs (Twilio, OpenAI)
- Set up billing alerts
- Optimize database queries

## Security Checklist

- [ ] HTTPS enforced
- [ ] Environment variables secured
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Webhook signatures verified
- [ ] SQL injection protection (Prisma)
- [ ] XSS protection enabled
- [ ] CSRF tokens validated
- [ ] Password requirements enforced
- [ ] 2FA available
- [ ] Audit logging enabled
- [ ] Regular security updates

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review Next.js build logs
3. Check browser console for errors
4. Verify all environment variables
5. Test API endpoints directly
6. Review external service dashboards

For additional help:
- Vercel Support: https://vercel.com/support
- GitHub Issues: Create an issue in your repository
- Documentation: Refer to docs/ folder
