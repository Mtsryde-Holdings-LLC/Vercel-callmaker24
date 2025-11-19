# 🚀 Mailgun Quick Reference

## 📋 Setup Checklist (5 minutes)

1. **Create account**: https://www.mailgun.com/ (Free: 5,000 emails/month)
2. **Get credentials**: Settings → API Keys → Copy Private API key
3. **Update `.env.local`**:
   ```env
   EMAIL_PROVIDER=mailgun
   MAILGUN_API_KEY=key-your-api-key
   MAILGUN_DOMAIN=sandbox123.mailgun.org (or mg.yourdomain.com)
   MAILGUN_REGION=us (or eu)
   EMAIL_FROM=noreply@sandbox123.mailgun.org
   ```
4. **Test**: `node scripts/test-mailgun.js`
5. **Done!** 🎉

## 🔑 Required Environment Variables

```env
EMAIL_PROVIDER=mailgun                # Set to 'mailgun'
MAILGUN_API_KEY=key-xxx              # From Settings → API Keys
MAILGUN_DOMAIN=mg.yourdomain.com     # Your domain or sandbox
MAILGUN_REGION=us                    # 'us' or 'eu'
EMAIL_FROM=noreply@mg.yourdomain.com # Your sending address
```

## 🧪 Testing

### Quick Test
```powershell
node scripts/test-mailgun.js
```

### Check Installation
```powershell
npm list mailgun.js
# Should show: mailgun.js@12.1.1
```

### Start Dev Server
```powershell
npm run dev
```

## 📊 Where to Find Things

### Mailgun Dashboard
- **API Keys**: Settings → API Keys
- **Domains**: Sending → Domains
- **Logs**: Sending → Logs
- **Analytics**: Analytics → Overview
- **Webhooks**: Sending → Webhooks
- **Suppressions**: Sending → Suppressions

### Your Code
- **Email Service**: `src/services/email.service.ts`
- **Webhook Handler**: `src/app/api/webhooks/mailgun/route.ts`
- **Email Validation**: `src/services/email-validation.service.ts`
- **Test Script**: `scripts/test-mailgun.js`

### Documentation
- **Setup Guide**: `MAILGUN_SETUP_GUIDE.md` (detailed)
- **Checklist**: `MAILGUN_CHECKLIST.md` (step-by-step)
- **Comparison**: `EMAIL_PROVIDER_COMPARISON.md` (vs other providers)

## 🔧 Common Commands

```powershell
# Test Mailgun
node scripts/test-mailgun.js

# Start development
npm run dev

# Check for errors
npm run lint

# Deploy to production
git add .
git commit -m "Configure Mailgun"
git push origin main
```

## 🌐 Vercel Deployment

Add to Vercel environment variables:
1. Go to https://vercel.com → Your Project → Settings → Environment Variables
2. Add all 5 Mailgun variables (see above)
3. Apply to: Production, Preview, Development
4. Redeploy

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Domain not found" | Check domain name in `.env.local` matches Mailgun dashboard |
| "401 Unauthorized" | Verify API key is correct (starts with `key-`) |
| "Sandbox can't send" | Add recipient as authorized or use custom domain |
| Emails to spam | Configure custom domain with SPF/DKIM records |
| "Region error" | Set MAILGUN_REGION to 'us' or 'eu' (check dashboard URL) |

## 💰 Pricing Quick Reference

| Volume | Cost/Month |
|--------|-----------|
| 5,000 | FREE (3 months) |
| 50,000 | $35 |
| 100,000 | $80 |
| 250,000 | ~$160 |
| 1,000,000 | ~$800 |

**Email Validation**: $0.004 per validation

## 📈 Key Metrics to Monitor

- **Delivery Rate**: Should be >95%
- **Bounce Rate**: Should be <5%
- **Complaint Rate**: Should be <0.1%
- **Open Rate**: 15-25% (marketing emails)
- **Click Rate**: 2-5% (marketing emails)

Check in Mailgun Dashboard → Analytics

## 🎯 Sandbox vs Custom Domain

### Sandbox Domain
- ✅ Free, instant setup
- ✅ Perfect for testing
- ❌ Can only send to 5 authorized recipients
- ❌ Lower deliverability (may go to spam)

### Custom Domain (e.g., mg.yourdomain.com)
- ✅ Send to anyone
- ✅ Best deliverability
- ✅ Professional branding
- ❌ Requires DNS setup (24-48 hours)
- ❌ Need to own a domain

**Recommendation**: Start with sandbox for testing, switch to custom domain for production.

## 🔗 Important URLs

- **Mailgun Dashboard**: https://app.mailgun.com/
- **Documentation**: https://documentation.mailgun.com/
- **API Reference**: https://documentation.mailgun.com/en/latest/api-intro.html
- **Status Page**: https://status.mailgun.com/
- **Support**: support@mailgun.com

## 📧 Test Email Addresses (Development)

Mailgun provides special test addresses:

- `postmaster@sandbox-xxx.mailgun.org` - Always delivers
- `test@sandbox-xxx.mailgun.org` - Bounces
- `spam@sandbox-xxx.mailgun.org` - Gets marked as spam

## ✅ Success Indicators

You'll know it's working when:
- ✅ Test script sends email successfully
- ✅ Email appears in Mailgun Dashboard → Logs
- ✅ Email arrives in inbox (not spam)
- ✅ Application can send emails (registration, password reset, etc.)
- ✅ No errors in console logs

## 🎓 Next Steps After Setup

1. [ ] Test with sandbox domain
2. [ ] Configure custom domain (for production)
3. [ ] Set up webhooks for tracking
4. [ ] Add email validation to contact forms
5. [ ] Monitor deliverability metrics
6. [ ] Create email templates
7. [ ] Deploy to Vercel with environment variables

## 🔐 Security Checklist

- [ ] API key in `.env.local` (not in code)
- [ ] `.env.local` in `.gitignore`
- [ ] Webhook signing key configured
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS
- [ ] Unsubscribe links in marketing emails
- [ ] Rate limiting implemented

## 🆘 Need Help?

1. **Check logs**: Mailgun Dashboard → Sending → Logs
2. **Read docs**: `MAILGUN_SETUP_GUIDE.md`
3. **Test config**: `node scripts/test-mailgun.js`
4. **Mailgun support**: support@mailgun.com
5. **Documentation**: https://documentation.mailgun.com/

---

**Current Status**: ⏳ Awaiting Mailgun credentials

**Estimated Setup Time**: 5-15 minutes

**Files Ready**:
- ✅ Email service configured
- ✅ Webhook handler created
- ✅ Validation service ready
- ✅ Test script available
- ✅ Documentation complete

**Next Action**: Get Mailgun API credentials and update `.env.local`
