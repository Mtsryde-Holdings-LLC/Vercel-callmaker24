# Twilio Configuration Guide for CallMaker24

## 🚀 Complete Twilio Setup for SMS & Call Center

This guide will help you configure Twilio for both SMS messaging and Call Center functionality.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Twilio Account Setup](#twilio-account-setup)
3. [Phone Number Configuration](#phone-number-configuration)
4. [SMS Configuration](#sms-configuration)
5. [Voice/Call Center Configuration](#voice-call-center-configuration)
6. [Webhook Configuration](#webhook-configuration)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)

---

## Prerequisites

### What You'll Need:
- ✅ Twilio Account (Sign up at https://www.twilio.com/try-twilio)
- ✅ Phone number capable of SMS and Voice
- ✅ Credit card for production (trial works for testing)
- ✅ Domain with HTTPS (for webhooks)

---

## 🔧 Twilio Account Setup

### Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your email and phone number
4. Complete the onboarding questionnaire

### Step 2: Get Your Credentials

1. Go to https://console.twilio.com/
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Click the eye icon to reveal your Auth Token

**Add to `.env.local`:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
```

---

## 📱 Phone Number Configuration

### Option 1: Buy a New Number (Recommended for Production)

1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/search
2. Select your country
3. Check capabilities needed:
   - ✅ **Voice** (for calls)
   - ✅ **SMS** (for text messages)
   - ✅ **MMS** (for media messages)
4. Click "Search" and choose a number
5. Click "Buy" ($1-$15/month depending on country and capabilities)

### Option 2: Use Trial Number (Testing Only)

**Trial Limitations:**
- Can only call/text verified numbers
- Shows "Sent from a Twilio trial account" message
- Limited to 500 SMS and $15 in credits

**Add to `.env.local`:**
```env
TWILIO_PHONE_NUMBER=+1234567890
```

**Example:**
```env
TWILIO_PHONE_NUMBER=+15551234567
```

---

## 💬 SMS Configuration

### 1. Enable SMS on Your Number

Your purchased number should have SMS enabled by default. Verify:

1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click on your phone number
3. Scroll to "Messaging" section
4. Ensure "Accept Incoming" is set to "SMS and MMS"

### 2. Configure SMS Webhook

**For incoming SMS messages:**

1. In the phone number settings, find "A MESSAGE COMES IN"
2. Set to: `https://yourdomain.com/api/sms/webhook`
3. Method: `POST`
4. Save

### 3. SMS Features Available

✅ **Send Single SMS**
```typescript
import { SmsService } from '@/services/sms.service'

await SmsService.send({
  to: '+1234567890',
  message: 'Hello from CallMaker24!'
})
```

✅ **Send Batch SMS**
```typescript
await SmsService.sendBatch([
  { to: '+1234567890', message: 'Message 1' },
  { to: '+1987654321', message: 'Message 2' }
])
```

✅ **Send MMS (with images)**
```typescript
await SmsService.send({
  to: '+1234567890',
  message: 'Check out this image!',
  mediaUrl: ['https://example.com/image.jpg']
})
```

✅ **Send OTP Codes**
```typescript
await SmsService.sendOtp('+1234567890', '123456')
```

---

## 📞 Voice/Call Center Configuration

### 1. Enable Voice on Your Number

1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click on your phone number
3. Scroll to "Voice Configuration" section

### 2. Configure Voice Webhooks

**A CALL COMES IN:**
1. Set to: `https://yourdomain.com/api/voice/ivr`
2. Method: `POST`
3. Save

**CALL STATUS CHANGES:**
1. Set to: `https://yourdomain.com/api/voice/status`
2. Method: `POST`
3. Save

### 3. Call Center Features

#### ✅ Outbound Calls
```typescript
import { VoiceService } from '@/services/voice.service'

await VoiceService.initiateCall({
  to: '+1234567890',
  menuId: 'optional-ivr-menu-id'
})
```

#### ✅ IVR (Interactive Voice Response)
- Automated phone menus
- Press 1 for Sales, 2 for Support, etc.
- Custom menu configuration in database

#### ✅ Call Recording
- All calls recorded automatically
- Recordings accessible via API
- Stored in Twilio (30-day retention)

#### ✅ Call Queuing
- Hold music for customers
- Route to available agents
- Queue statistics and reporting

#### ✅ Call Forwarding
```typescript
// Forward to agent's phone
twiml.dial('+1234567890')
```

#### ✅ Conference Calls
```typescript
twiml.dial().conference('RoomName')
```

---

## 🔗 Webhook Configuration

### Required Webhooks

Create these API routes (already implemented in your project):

| Webhook | URL | Purpose |
|---------|-----|---------|
| Incoming SMS | `/api/sms/webhook` | Receive SMS messages |
| Voice IVR | `/api/voice/ivr` | Handle incoming calls |
| Call Status | `/api/voice/status` | Track call progress |
| Voice Keypress | `/api/voice/handle-key` | Handle IVR menu selections |

### Webhook Security

Twilio signs all webhooks with a signature. Verify requests:

```typescript
import { validateRequest } from 'twilio'

const isValid = validateRequest(
  process.env.TWILIO_AUTH_TOKEN!,
  signature,
  url,
  params
)
```

---

## 🧪 Testing

### Test SMS Sending

```bash
# Run the test script
node scripts/test-twilio.js
```

Or test via API:
```bash
curl -X POST https://yourdomain.com/api/test-sms?to=+1234567890
```

### Test Voice Calls

```bash
curl -X POST https://yourdomain.com/api/test-call?to=+1234567890
```

### Test Webhooks Locally

Use **ngrok** to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Update Twilio webhooks to use this URL:
# https://abc123.ngrok.io/api/sms/webhook
# https://abc123.ngrok.io/api/voice/ivr
```

---

## 🚀 Production Deployment

### 1. Update Environment Variables

**In Vercel Dashboard:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### 2. Update Webhooks to Production URLs

In Twilio Console, update all webhooks to use your production domain:
- SMS: `https://callmaker24.com/api/sms/webhook`
- Voice: `https://callmaker24.com/api/voice/ivr`
- Status: `https://callmaker24.com/api/voice/status`

### 3. Verify .env.local Configuration

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# Your production URL
NEXT_PUBLIC_APP_URL=https://callmaker24.com
```

---

## 💰 Pricing (as of 2024)

### Phone Number Costs
- **US/Canada Number:** $1.15/month
- **Toll-Free Number:** $2.00/month

### SMS Pricing
- **Outbound SMS (US):** $0.0079 per message
- **Inbound SMS (US):** $0.0079 per message
- **MMS:** $0.02 per message

### Voice Pricing
- **Outbound Calls (US):** $0.013 per minute
- **Inbound Calls (US):** $0.0085 per minute
- **Recording Storage:** $0.0005 per minute

### Free Trial Credits
- **$15.50 in free credits**
- Can send ~500 SMS or ~60 minutes of calls

---

## 🎯 Quick Start Checklist

- [ ] Created Twilio account
- [ ] Got Account SID and Auth Token
- [ ] Purchased phone number with SMS + Voice
- [ ] Added credentials to `.env.local`
- [ ] Configured SMS webhook
- [ ] Configured Voice webhooks
- [ ] Tested SMS sending
- [ ] Tested voice calls
- [ ] Deployed to production
- [ ] Updated production webhooks
- [ ] Added Vercel environment variables

---

## 📚 Additional Resources

- **Twilio Console:** https://console.twilio.com/
- **Twilio Docs:** https://www.twilio.com/docs
- **SMS API:** https://www.twilio.com/docs/sms
- **Voice API:** https://www.twilio.com/docs/voice
- **TwiML Documentation:** https://www.twilio.com/docs/voice/twiml
- **Webhook Security:** https://www.twilio.com/docs/usage/webhooks/webhooks-security

---

## 🆘 Troubleshooting

### SMS not sending?
- ✅ Check Account SID and Auth Token are correct
- ✅ Verify phone number has SMS capability
- ✅ Check number format (use E.164: +1234567890)
- ✅ Ensure you have credits in your account

### Calls not working?
- ✅ Verify phone number has Voice capability
- ✅ Check webhook URLs are accessible (HTTPS required)
- ✅ Test webhook URLs with curl
- ✅ Check Twilio debugger for errors

### Webhooks not receiving data?
- ✅ Ensure URL is publicly accessible
- ✅ Must use HTTPS (not HTTP)
- ✅ Check webhook signature validation
- ✅ Review Twilio error logs in console

---

## 🔒 Security Best Practices

1. **Never commit credentials to Git**
2. **Always validate webhook signatures**
3. **Use environment variables for all secrets**
4. **Restrict API access by IP (optional)**
5. **Enable two-factor authentication on Twilio account**
6. **Regularly rotate Auth Tokens**
7. **Monitor usage for unusual activity**

---

## ✅ You're Ready!

Your CallMaker24 platform is now configured for:
- ✅ Sending and receiving SMS
- ✅ Making and receiving calls
- ✅ IVR menus and call routing
- ✅ Call recording and analytics
- ✅ Queue management
- ✅ Multi-channel communication

**Next Steps:**
1. Run the test script to verify everything works
2. Create your first IVR menu in the dashboard
3. Send test SMS to customers
4. Make a test call to verify voice setup
