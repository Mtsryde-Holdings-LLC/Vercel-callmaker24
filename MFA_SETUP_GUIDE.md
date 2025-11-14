# MFA Setup Guide - AWS SES & Twilio Configuration

## ✅ What's Been Implemented

Your CallMaker24 application now has full Multi-Factor Authentication with:
- **2-step signup process** (Register → Verify Code)
- **AWS SES** for email verification codes
- **Twilio SMS** for text message verification
- **Welcome emails** after successful verification
- **Code expiration** (10 minutes)
- **Resend code** functionality

## 🔧 Required Environment Variables

### Add these to your Vercel Dashboard:

#### AWS SES Configuration (for Email)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_SES_FROM_EMAIL=noreply@callmaker24.com
```

#### Twilio Configuration (Already Set - Verify These)
```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 📋 AWS SES Setup Steps

### 1. Get AWS SES Credentials

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **IAM** → **Users** → **Create User**
3. User name: `callmaker24-ses`
4. Attach policy: **AmazonSESFullAccess**
5. Create **Access Key** → Copy `Access Key ID` and `Secret Access Key`

### 2. Verify Your Sender Email

1. Go to **Amazon SES** → **Verified Identities**
2. Click **Create Identity** → Choose **Email Address**
3. Enter: `noreply@callmaker24.com` (or your domain)
4. Check your email and click verification link
5. Wait for "Verified" status

### 3. Request Production Access (Important!)

AWS SES starts in **Sandbox Mode** (limited to verified emails only).

To send to ANY email address:
1. Go to **Amazon SES** → **Account Dashboard**
2. Click **Request production access**
3. Fill out the form:
   - **Use case**: Transactional emails
   - **Website URL**: https://vercel-callmaker24-bt9yafrf8-callmaker24.vercel.app
   - **Describe use case**: "Sending verification codes and transactional emails for our SaaS platform"
4. Submit request (usually approved within 24 hours)

**Until approved**, you can only send to:
- Verified email addresses
- Your own email for testing

### 4. Configure SPF and DKIM (Optional but Recommended)

If using a custom domain:
1. Go to **Amazon SES** → **Verified Identities** → Your Domain
2. Copy the **DKIM records**
3. Add them to your domain's DNS settings
4. This improves email deliverability

## 🧪 Testing the MFA Flow

### Development Testing (With Console Logs)

1. Start local server: `npm run dev`
2. Go to `/auth/signup`
3. Fill registration form
4. Select MFA method (SMS or Email)
5. Check **terminal logs** for verification code
6. Enter code on Step 2
7. Should auto-login and redirect to dashboard

### Production Testing

**Before AWS SES Production Access:**
- Only test with your verified email address
- SMS will work if Twilio is configured

**After AWS SES Production Access:**
- Test with any email address
- Verification codes sent to email and SMS

## ⚠️ Critical: Clear Vercel Build Cache

**You MUST do this first**, or signup will still fail with localhost database error:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Deployments** tab
4. Click the **"..."** menu on latest deployment
5. Click **Redeploy**
6. **UNCHECK** "Use existing Build Cache"
7. Click **Redeploy**

This forces Vercel to read the correct DATABASE_URL from environment variables.

## 🔍 Troubleshooting

### Email Not Sending

**Check AWS SES Status:**
```bash
# In AWS Console → SES → Verified Identities
# Status should be "Verified" (not "Pending")
```

**Check Environment Variables:**
```bash
# Visit: https://your-app.vercel.app/api/health
# Should show environment variables are set
```

**Check Vercel Logs:**
```bash
# In Vercel Dashboard → Deployments → Click deployment → Function Logs
# Look for "Verification email sent to..." or error messages
```

### SMS Not Sending

**Check Twilio Account:**
- Verify phone number format: Must include country code (e.g., +1234567890)
- Check Twilio balance
- Check Twilio Dashboard for error logs

**Twilio Trial Account Limitations:**
- Can only send to verified phone numbers
- Need to upgrade to send to any number

### "Invalid Verification Code" Error

- Code expires in 10 minutes
- Check that user is entering correct code
- Use "Resend code" button to get a new code
- In development, code is logged to console

### Database Connection Still Failing

- Did you clear Vercel build cache?
- Check `/api/health` endpoint shows correct DATABASE_URL
- Verify DATABASE_URL in Vercel doesn't contain "localhost"

## 📊 What Happens During MFA Flow

1. **User Registration** (`/api/auth/register`):
   - Creates user account (unverified)
   - Generates 6-digit code
   - Stores code + expiry in database
   - Sends code via SMS or Email
   - Returns success (moves to Step 2)

2. **User Enters Code** (`/api/auth/verify-mfa`):
   - Validates code matches database
   - Checks code hasn't expired
   - Marks user as verified
   - Sends welcome email
   - Auto-signs in user
   - Redirects to dashboard

3. **Resend Code** (`/api/auth/resend-mfa`):
   - Generates new 6-digit code
   - Updates database with new code + expiry
   - Sends new code via SMS or Email

## 🎯 Next Steps

1. ✅ Clear Vercel build cache (CRITICAL)
2. ✅ Add AWS SES credentials to Vercel
3. ✅ Verify sender email in AWS SES
4. ✅ Request AWS SES production access
5. ✅ Test signup flow
6. ✅ Configure custom domain email (optional)
7. ✅ Set up email templates branding (optional)

## 📧 Need Help?

- AWS SES Issues: Check [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- Twilio Issues: Check [Twilio Console](https://console.twilio.com/)
- Vercel Issues: Check deployment logs in Vercel Dashboard

---

**Deployment Status:** Latest commit pushed (2ab8f44)  
**Features:** MFA with AWS SES + Twilio ✅  
**Database:** Schema updated with MFA fields ✅  
**Next:** Clear Vercel cache and add AWS credentials
