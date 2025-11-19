# Mailgun Integration - Quick Start Checklist

## ✅ Pre-Setup (Completed)
- [x] Mailgun SDK installed (`mailgun.js@12.1.1`)
- [x] Email service configured with Mailgun support
- [x] Webhook handler created
- [x] Email validation service ready
- [x] Test script available

## 📋 Setup Steps (Your Action Required)

### Step 1: Create Mailgun Account (5 minutes)
- [ ] Go to https://www.mailgun.com/
- [ ] Sign up for free account (5,000 emails/month for 3 months)
- [ ] Verify your account via email

### Step 2: Get API Credentials (2 minutes)
- [ ] Login to Mailgun dashboard
- [ ] Go to **Settings** → **API Keys**
- [ ] Copy your **Private API key** (starts with `key-...`)
- [ ] Note your region: **US** or **EU** (from dashboard URL)

### Step 3: Choose Domain Option

#### Option A: Sandbox Domain (Quick Start - Testing Only)
- [ ] Use provided sandbox domain (e.g., `sandbox123abc.mailgun.org`)
- [ ] Go to **Sending** → **Domain Settings** → **Authorized Recipients**
- [ ] Add your email address as authorized recipient
- [ ] Verify email address via confirmation link
- ⚠️ **Limitation**: Can only send to 5 authorized email addresses

#### Option B: Custom Domain (Production Ready)
- [ ] Go to **Sending** → **Domains** → **Add New Domain**
- [ ] Enter subdomain (recommended: `mg.yourdomain.com` or `mail.yourdomain.com`)
- [ ] Copy provided DNS records
- [ ] Add DNS records to your domain provider:
  - [ ] TXT record for SPF
  - [ ] TXT record for DKIM
  - [ ] CNAME records for tracking
  - [ ] MX records for receiving
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Verify domain is active in Mailgun

### Step 4: Configure Environment Variables (2 minutes)
- [ ] Open `.env.local` file
- [ ] Update the following variables:

```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-your-actual-api-key-here
MAILGUN_DOMAIN=sandbox123abc.mailgun.org (or mg.yourdomain.com)
MAILGUN_REGION=us (or eu)
EMAIL_FROM=noreply@sandbox123abc.mailgun.org (or noreply@mg.yourdomain.com)
```

### Step 5: Test Configuration (5 minutes)
- [ ] Run test script:
```powershell
node scripts/test-mailgun.js
```
- [ ] Enter your Mailgun credentials when prompted
- [ ] Check your email inbox for test message
- [ ] Verify email was received successfully

### Step 6: Test in Application (5 minutes)
- [ ] Start development server:
```powershell
npm run dev
```
- [ ] Test email sending features:
  - [ ] User registration (welcome email)
  - [ ] Password reset
  - [ ] Email campaign send
- [ ] Check Mailgun dashboard → **Logs** for sent emails

### Step 7: Configure Webhooks (Optional - 5 minutes)
- [ ] In Mailgun dashboard, go to **Sending** → **Webhooks**
- [ ] Add webhook URL: `https://yourdomain.com/api/webhooks/mailgun`
- [ ] Select events to track:
  - [ ] delivered
  - [ ] opened
  - [ ] clicked
  - [ ] bounced
  - [ ] complained
  - [ ] unsubscribed
- [ ] Copy webhook signing key
- [ ] Add to `.env.local`:
```env
MAILGUN_WEBHOOK_SIGNING_KEY=your-signing-key-here
```

### Step 8: Production Deployment (10 minutes)
- [ ] Go to Vercel dashboard
- [ ] Navigate to your project settings
- [ ] Add environment variables:
  - [ ] `EMAIL_PROVIDER=mailgun`
  - [ ] `MAILGUN_API_KEY=your-key`
  - [ ] `MAILGUN_DOMAIN=your-domain`
  - [ ] `MAILGUN_REGION=us` (or eu)
  - [ ] `EMAIL_FROM=noreply@your-domain`
  - [ ] `MAILGUN_WEBHOOK_SIGNING_KEY=your-key` (if using webhooks)
- [ ] Apply to: Production, Preview, Development
- [ ] Trigger new deployment
- [ ] Test production email sending

## 🎯 Quick Commands

### Test Mailgun Configuration
```powershell
node scripts/test-mailgun.js
```

### Start Development Server
```powershell
npm run dev
```

### Check Mailgun Package
```powershell
npm list mailgun.js
```

### Deploy to Production
```powershell
git add .
git commit -m "Configure Mailgun email service"
git push origin main
```

## 📊 Monitoring

### After Setup, Monitor:
- [ ] **Mailgun Dashboard** → **Analytics** (check delivery rates)
- [ ] **Mailgun Dashboard** → **Logs** (view all sent emails)
- [ ] **Mailgun Dashboard** → **Suppressions** (check bounces/complaints)
- [ ] Keep delivery rate above 95%
- [ ] Keep bounce rate below 5%
- [ ] Keep complaint rate below 0.1%

## 🆘 Troubleshooting

### "Domain not found" error
- Verify domain is added in Mailgun dashboard
- Check DNS records are correct
- Wait 24-48 hours for DNS propagation

### "Forbidden" or "401 Unauthorized"
- Verify API key is correct (copy/paste carefully)
- Use Private API key (not Public)
- Check region matches (US vs EU)

### Emails going to spam
- Configure custom domain (not sandbox)
- Add all DNS records (SPF, DKIM, DMARC)
- Warm up domain (start with low volumes)
- Use proper HTML formatting
- Include unsubscribe link

### "Sandbox domain can't send to this recipient"
- Add recipient as authorized in Mailgun dashboard
- Or switch to custom domain for production

## ✨ Features Available

Your Mailgun integration includes:

- ✅ **Email Sending**: Send transactional and marketing emails
- ✅ **Email Validation**: Validate emails before sending
- ✅ **Webhooks**: Real-time email event tracking
- ✅ **Analytics**: Detailed delivery and engagement metrics
- ✅ **Tracking**: Open and click tracking
- ✅ **Bounce Handling**: Automatic bounce management
- ✅ **Complaint Handling**: Spam complaint tracking
- ✅ **Batch Sending**: Send multiple emails efficiently

## 📈 Usage Tracking

### Free Tier Limits:
- 5,000 emails/month for 3 months
- After trial: $35/month for 50,000 emails

### Cost Estimation:
- 10,000 emails/month: Free (during trial) or $35/month
- 50,000 emails/month: $35/month
- 100,000 emails/month: $80/month
- 1,000,000 emails/month: ~$800-1000/month

## 🚀 Next Steps After Setup

1. Switch from sandbox to custom domain (if using sandbox)
2. Configure email templates for better branding
3. Set up email validation for list cleaning
4. Configure webhooks for tracking
5. Monitor deliverability metrics
6. Implement email list segmentation
7. Set up automated email campaigns

## 📚 Resources

- Setup Guide: `MAILGUN_SETUP_GUIDE.md`
- Test Script: `scripts/test-mailgun.js`
- Webhook Handler: `src/app/api/webhooks/mailgun/route.ts`
- Email Service: `src/services/email.service.ts`
- Validation Service: `src/services/email-validation.service.ts`
- Mailgun Docs: https://documentation.mailgun.com/

---

**Estimated Total Setup Time**: 15-30 minutes (sandbox) or 2-3 days (custom domain with DNS)

**Current Status**: ⏳ Awaiting Mailgun credentials configuration
