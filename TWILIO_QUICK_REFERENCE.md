# Twilio Quick Reference Card

## 🔑 Credentials

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

Get from: https://console.twilio.com/

---

## 📱 SMS

### Send Single SMS
```typescript
import { SmsService } from '@/services/sms.service'

await SmsService.send({
  to: '+1234567890',
  message: 'Hello from CallMaker24!'
})
```

### Send with Media (MMS)
```typescript
await SmsService.send({
  to: '+1234567890',
  message: 'Check this out!',
  mediaUrl: ['https://example.com/image.jpg']
})
```

### Send OTP
```typescript
await SmsService.sendOtp('+1234567890', '123456')
```

### Batch SMS
```typescript
await SmsService.sendBatch([
  { to: '+1111111111', message: 'Message 1' },
  { to: '+2222222222', message: 'Message 2' }
])
```

---

## 📞 Voice/Calls

### Make Call
```typescript
import { VoiceService } from '@/services/voice.service'

await VoiceService.initiateCall({
  to: '+1234567890',
  menuId: 'optional-menu-id'
})
```

### Get Recording
```typescript
await VoiceService.getRecording('CA1234567890abcdef')
```

---

## 🔗 Webhooks (Configure in Twilio Console)

| Webhook | URL | Configure At |
|---------|-----|-------------|
| SMS Incoming | `https://yourdomain.com/api/sms/webhook` | Phone Numbers → Messaging |
| Voice Incoming | `https://yourdomain.com/api/voice/ivr` | Phone Numbers → Voice |
| Call Status | `https://yourdomain.com/api/voice/status` | Phone Numbers → Voice |

---

## 🧪 Test Endpoints

```bash
# Test SMS
curl "https://yourdomain.com/api/test-sms?to=+1234567890"

# Test Call
curl "https://yourdomain.com/api/test-call?to=+1234567890"

# Run test script
node scripts/test-twilio.js
```

---

## 🔒 Security - Validate Webhooks

```typescript
import twilio from 'twilio'

const signature = request.headers.get('x-twilio-signature')
const isValid = twilio.validateRequest(
  process.env.TWILIO_AUTH_TOKEN!,
  signature,
  url,
  params
)
```

---

## 💰 Pricing (US)

- **Phone Number:** $1.15/month
- **SMS Outbound:** $0.0079/msg
- **SMS Inbound:** $0.0079/msg
- **Voice Outbound:** $0.013/min
- **Voice Inbound:** $0.0085/min
- **Recording:** $0.0005/min

---

## 🚨 Troubleshooting

### SMS Not Sending
- ✅ Check Account SID and Auth Token
- ✅ Verify phone number has SMS capability
- ✅ Use E.164 format: +1234567890
- ✅ Check account balance

### Calls Not Working
- ✅ Verify phone number has Voice capability
- ✅ Check webhook URLs are HTTPS
- ✅ Validate webhook signature
- ✅ Check Twilio debugger for errors

### Trial Account Limitations
- Can only call/SMS verified numbers
- Shows "trial" message in SMS
- $15 in free credits
- Upgrade to remove restrictions

---

## 📚 Resources

- **Console:** https://console.twilio.com/
- **Docs:** https://www.twilio.com/docs
- **SMS API:** https://www.twilio.com/docs/sms
- **Voice API:** https://www.twilio.com/docs/voice
- **TwiML:** https://www.twilio.com/docs/voice/twiml

---

## ✅ Setup Checklist

- [ ] Created Twilio account
- [ ] Got Account SID and Auth Token
- [ ] Purchased phone number (Voice + SMS)
- [ ] Added to .env.local
- [ ] Configured SMS webhook
- [ ] Configured Voice webhooks
- [ ] Tested SMS sending
- [ ] Tested voice calls
- [ ] Deployed to production
- [ ] Updated production webhooks

---

**Need Help?** See full guide: `TWILIO_SETUP_GUIDE.md`
