# Mailgun Integration Setup Guide

## Overview
Mailgun is a powerful email service provider that offers reliable email delivery, detailed analytics, and excellent deliverability rates. This guide will walk you through setting up Mailgun for your CallMaker24 platform.

## Why Mailgun?

- **High Deliverability**: Industry-leading email deliverability rates
- **Analytics**: Detailed tracking of opens, clicks, bounces, and complaints
- **Scalability**: Send millions of emails per month
- **Reliability**: 99.99% uptime SLA
- **Email Validation**: Built-in email validation API
- **Webhooks**: Real-time notifications for all email events
- **Free Tier**: 5,000 emails/month free for 3 months

## Step 1: Create Mailgun Account

1. Go to [Mailgun.com](https://www.mailgun.com/)
2. Click **Sign Up** (or login if you have an account)
3. Choose a plan:
   - **Free Trial**: 5,000 emails/month for 3 months
   - **Foundation**: $35/month for 50,000 emails
   - **Growth**: $80/month for 100,000 emails
   - **Scale**: Custom pricing for higher volumes

## Step 2: Get Your API Credentials

### Option A: Using Mailgun Sandbox (Testing)

1. After signup, you'll automatically get a **sandbox domain**
2. Navigate to **Sending** → **Domain Settings**
3. Click on your sandbox domain (e.g., `sandbox123abc.mailgun.org`)
4. Copy the following:
   - **API Key**: Found under "API Keys" section
   - **Domain**: Your sandbox domain
   - **Region**: `us` or `eu` (shown in the URL)

**Note**: Sandbox domains can only send to authorized recipients (max 5 email addresses you must verify first).

### Option B: Using Custom Domain (Production)

1. Navigate to **Sending** → **Domains**
2. Click **Add New Domain**
3. Enter your domain (e.g., `mg.callmaker24.com` or `mail.callmaker24.com`)
4. Add the following DNS records to your domain provider:

```
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all

Type: TXT  
Name: mailo._domainkey
Value: [Mailgun will provide this DKIM value]

Type: CNAME
Name: email.mg
Value: mailgun.org

Type: MX
Name: mg
Value: mxa.mailgun.org
Priority: 10

Type: MX
Name: mg
Value: mxb.mailgun.org
Priority: 10
```

5. Wait 24-48 hours for DNS propagation
6. Mailgun will verify your domain automatically
7. Once verified, copy your **API Key** and **Domain**

## Step 3: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Email Service Configuration
EMAIL_PROVIDER=mailgun

# Mailgun Configuration
MAILGUN_API_KEY=your-mailgun-api-key-here
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_REGION=us

# Email Settings
EMAIL_FROM=noreply@mg.yourdomain.com
```

### Finding Your Mailgun Credentials:

**API Key**:
- Go to **Settings** → **API Keys**
- Copy your **Private API key** (starts with `key-...`)

**Domain**:
- Go to **Sending** → **Domains**
- Copy the domain name (e.g., `mg.callmaker24.com` or sandbox domain)

**Region**:
- If you see `api.mailgun.net` in URLs → use `us`
- If you see `api.eu.mailgun.net` in URLs → use `eu`

## Step 4: Verify Installation

Your project already has the Mailgun SDK installed. Verify with:

```powershell
npm list mailgun.js
```

You should see:
```
mailgun.js@12.1.1
```

## Step 5: Test Email Sending

### Test via Development Server:

1. Start your development server:
```powershell
npm run dev
```

2. Navigate to your app and test email sending through:
   - User registration
   - Email campaigns
   - Password reset
   - Any feature that sends emails

### Test via API Route:

Create a test file: `test-mailgun.js`

```javascript
const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: 'YOUR_API_KEY_HERE',
  url: 'https://api.mailgun.net' // or 'https://api.eu.mailgun.net'
});

mg.messages.create('YOUR_DOMAIN_HERE', {
  from: "CallMaker24 <noreply@YOUR_DOMAIN_HERE>",
  to: ["your-email@example.com"],
  subject: "Mailgun Test Email",
  text: "Testing Mailgun integration!",
  html: "<h1>Success!</h1><p>Mailgun is working correctly.</p>"
})
.then(msg => console.log('Success:', msg))
.catch(err => console.error('Error:', err));
```

Run:
```powershell
node test-mailgun.js
```

## Step 6: Configure Email Webhooks (Optional but Recommended)

Webhooks provide real-time notifications for email events.

1. Go to **Sending** → **Webhooks**
2. Click **Add Webhook**
3. Configure webhooks for:
   - **delivered**: `https://yourdomain.com/api/webhooks/mailgun?event=delivered`
   - **opened**: `https://yourdomain.com/api/webhooks/mailgun?event=opened`
   - **clicked**: `https://yourdomain.com/api/webhooks/mailgun?event=clicked`
   - **bounced**: `https://yourdomain.com/api/webhooks/mailgun?event=bounced`
   - **complained**: `https://yourdomain.com/api/webhooks/mailgun?event=complained`
   - **unsubscribed**: `https://yourdomain.com/api/webhooks/mailgun?event=unsubscribed`

4. Copy the **Webhook Signing Key** and add to `.env.local`:
```env
MAILGUN_WEBHOOK_SIGNING_KEY=your-signing-key-here
```

## Step 7: Email Validation Setup (Optional)

Mailgun provides an email validation API to verify email addresses before sending.

1. Go to **Validations** → **Settings**
2. Copy your **Validation API Key**
3. Add to `.env.local`:
```env
MAILGUN_VALIDATION_KEY=your-validation-key-here
```

## Step 8: Production Deployment

### Vercel Configuration:

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project: **callmaker24**
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

```
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_REGION=us
EMAIL_FROM=noreply@mg.yourdomain.com
MAILGUN_WEBHOOK_SIGNING_KEY=your-signing-key (optional)
MAILGUN_VALIDATION_KEY=your-validation-key (optional)
```

5. Apply to: **Production**, **Preview**, and **Development**
6. Click **Save**
7. Trigger a new deployment

## Monitoring & Analytics

### Mailgun Dashboard:

1. **Logs**: View all sent emails at **Sending** → **Logs**
2. **Analytics**: View metrics at **Analytics** → **Overview**
3. **Tracking**: See opens/clicks in real-time
4. **Bounces**: Monitor bounce rates and suppression lists

### Key Metrics to Monitor:

- **Delivery Rate**: Should be >95%
- **Open Rate**: Typical 15-25% for marketing emails
- **Click Rate**: Typical 2-5% for marketing emails
- **Bounce Rate**: Should be <5%
- **Complaint Rate**: Should be <0.1%

## Troubleshooting

### Issue: "Domain not found" or "Invalid domain"

**Solution**: 
- Verify domain is added in Mailgun dashboard
- Check DNS records are properly configured
- Wait 24-48 hours for DNS propagation

### Issue: "Forbidden" or "401 Unauthorized"

**Solution**:
- Verify API key is correct
- Ensure you're using the Private API key (not Public)
- Check region is correct (US vs EU)

### Issue: Emails going to spam

**Solution**:
1. Verify SPF, DKIM, and DMARC records
2. Warm up your sending domain (start with small volumes)
3. Use proper email formatting with text + HTML versions
4. Avoid spam trigger words
5. Maintain clean email lists (remove bounces/complaints)

### Issue: Sandbox domain limitations

**Solution**:
- Sandbox can only send to 5 authorized recipients
- Add authorized recipients: **Sending** → **Domain Settings** → **Authorized Recipients**
- For production, use a custom domain

### Issue: Rate limiting

**Solution**:
- Free tier: 5,000 emails/month
- Check your current usage: **Analytics** → **Overview**
- Upgrade plan if needed
- Implement email queuing to avoid burst sending

## Best Practices

1. **Use Custom Domain**: Set up `mg.yourdomain.com` for better deliverability
2. **Warm Up Domain**: Start with low volumes and gradually increase
3. **Monitor Bounces**: Remove bounced emails from your lists
4. **Use Tags**: Tag emails for better organization and analytics
5. **Enable Tracking**: Track opens and clicks for campaign performance
6. **Implement Webhooks**: Get real-time updates on email events
7. **Email Validation**: Validate emails before sending to reduce bounces
8. **Unsubscribe Links**: Always include unsubscribe links in marketing emails
9. **Double Opt-In**: Use double opt-in for email list subscriptions
10. **List Hygiene**: Regularly clean your email lists

## Cost Estimation

### Mailgun Pricing (as of 2024):

| Plan | Monthly Cost | Emails Included | Additional Emails |
|------|--------------|-----------------|-------------------|
| Free Trial | $0 | 5,000 (3 months) | N/A |
| Foundation | $35 | 50,000 | $1/1,000 |
| Growth | $80 | 100,000 | $0.80/1,000 |
| Scale | Custom | Custom | Custom |

**Email Validation**: $0.004 per validation (bulk discounts available)

### Cost Examples:

- **10,000 emails/month**: Free trial or $35/month
- **50,000 emails/month**: $35/month (Foundation)
- **100,000 emails/month**: $80/month (Growth)
- **250,000 emails/month**: $200/month (Growth + additional)
- **1,000,000 emails/month**: ~$800-1000/month (Scale plan)

## Support Resources

- **Documentation**: https://documentation.mailgun.com/
- **API Reference**: https://documentation.mailgun.com/en/latest/api-intro.html
- **Status Page**: https://status.mailgun.com/
- **Support**: support@mailgun.com
- **Community**: https://stackoverflow.com/questions/tagged/mailgun

## Security Checklist

- [ ] API keys stored in environment variables (not in code)
- [ ] Webhook signing key configured
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS
- [ ] DMARC policy configured
- [ ] Rate limiting implemented
- [ ] Email validation enabled
- [ ] Bounce handling configured
- [ ] Complaint handling configured
- [ ] Unsubscribe mechanism working

## Next Steps

1. ✅ Create Mailgun account
2. ✅ Get API credentials
3. ✅ Add environment variables
4. ✅ Test email sending
5. ⏳ Configure custom domain (production)
6. ⏳ Set up webhooks
7. ⏳ Add to Vercel environment variables
8. ⏳ Test production deployment
9. ⏳ Monitor deliverability metrics
10. ⏳ Implement email validation

---

**Need Help?** Contact Mailgun support or check the documentation for detailed guides on specific features.
