# Mailgun Integration Architecture

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CallMaker24 Platform                         │
│                                                                 │
│  ┌─────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   User      │      │  Email       │      │   Database   │  │
│  │   Actions   │─────▶│  Service     │─────▶│   Updates    │  │
│  │             │      │              │      │              │  │
│  └─────────────┘      └──────┬───────┘      └──────────────┘  │
│                               │                                │
└───────────────────────────────┼────────────────────────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │   Mailgun     │
                        │   API         │
                        └───────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌───────────────┐      ┌──────────────┐
            │  Email        │      │  Tracking    │
            │  Delivery     │      │  & Stats     │
            └───────┬───────┘      └──────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  Recipient    │
            │  Inbox        │
            └───────┬───────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
   [Open Email]            [Click Link]
        │                        │
        └───────────┬────────────┘
                    │
                    ▼
            ┌──────────────┐
            │   Webhook    │
            │   Event      │
            └──────┬───────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │  /api/webhooks/mailgun       │
    │  (Your Webhook Handler)      │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────┐
    │  Database    │
    │  Update      │
    └──────────────┘
```

## 🔄 Email Sending Flow

### 1. User Registration Email
```
User Signup
    │
    ▼
AuthService.signup()
    │
    ▼
EmailService.send({
  to: user.email,
  subject: 'Welcome to CallMaker24',
  html: welcomeTemplate,
  tags: [{ name: 'type', value: 'welcome' }]
})
    │
    ▼
Mailgun Client
    │
    ▼
POST https://api.mailgun.net/v3/mg.yourdomain.com/messages
    │
    ▼
Mailgun Queue → Delivery → User Inbox
```

### 2. Email Campaign Flow
```
Campaign Creation
    │
    ▼
Select Contacts (e.g., 1000 recipients)
    │
    ▼
EmailService.sendBatch([...])
    │
    ├── Email 1 ─┐
    ├── Email 2 ─┤
    ├── Email 3 ─┼─→ Mailgun API (parallel)
    ├── Email 4 ─┤
    └── Email N ─┘
         │
         ▼
    Mailgun Queue
         │
         ├─→ Delivered (850)
         ├─→ Bounced (100)
         ├─→ Failed (50)
         │
         ▼
    Webhooks Fire
         │
         ▼
    Database Updates
         │
         ▼
    Analytics Dashboard
```

## 📡 Webhook Event Flow

### Email Lifecycle Events

```
Email Sent
    │
    ├─→ delivered ────────┐
    │   (within seconds)  │
    │                     │
    ├─→ bounced ──────────┼─→ Webhook → Database Update
    │   (invalid email)   │
    │                     │
    ├─→ failed ───────────┘
    │   (delivery error)
    │
    ▼
Email Delivered
    │
    ├─→ opened ───────────┐
    │   (user opens)      │
    │                     │
    ├─→ clicked ──────────┼─→ Webhook → Database Update
    │   (user clicks)     │
    │                     │
    ├─→ complained ───────┤
    │   (marked spam)     │
    │                     │
    └─→ unsubscribed ─────┘
        (clicked unsubscribe)
```

### Webhook Handler Logic

```
POST /api/webhooks/mailgun
    │
    ▼
Verify Signature
    │
    ├─→ Invalid → Return 401
    │
    ▼
Parse Event Data
    │
    ├─→ event: 'delivered'
    │   └─→ Update EmailLog status
    │       Update Campaign.delivered++
    │
    ├─→ event: 'opened'
    │   └─→ Update EmailLog.openedAt
    │       Update Campaign.opened++
    │
    ├─→ event: 'clicked'
    │   └─→ Update EmailLog.clickedAt
    │       Update Campaign.clicked++
    │
    ├─→ event: 'bounced'
    │   └─→ Update EmailLog.status = 'bounced'
    │       Update Campaign.bounced++
    │       Mark Contact.status = 'bounced'
    │
    ├─→ event: 'complained'
    │   └─→ Update EmailLog.status = 'complained'
    │       Update Campaign.complained++
    │       Mark Contact.unsubscribed = true
    │
    └─→ event: 'unsubscribed'
        └─→ Mark Contact.unsubscribed = true
            Update Contact.status = 'unsubscribed'
```

## 🔍 Email Validation Flow

### Before Sending Campaign

```
Upload Contact List (10,000 emails)
    │
    ▼
EmailValidationService.validateBulk()
    │
    ├─→ Basic Validation (free, instant)
    │   ├─→ Format check
    │   ├─→ Typo detection
    │   ├─→ Disposable email check
    │   └─→ Common domain check
    │
    ├─→ Mailgun Validation (optional, $0.004 each)
    │   ├─→ DNS MX record check
    │   ├─→ SMTP verification
    │   ├─→ Risk assessment
    │   └─→ Deliverability prediction
    │
    ▼
Results:
    ├─→ Valid: 8,500 (85%)
    ├─→ Invalid: 1,000 (10%)
    ├─→ Risky: 400 (4%)
    └─→ Typos: 100 (1%)
         │
         ▼
Clean List (8,500 valid emails)
    │
    ▼
Send Campaign → Higher deliverability, lower bounce rate
```

## 🗄️ Database Schema Integration

### EmailCampaign Table
```
┌─────────────────────────────────┐
│ EmailCampaign                   │
├─────────────────────────────────┤
│ id                              │
│ name                            │
│ subject                         │
│ content (HTML)                  │
│ sent: 1000     ◄───┐           │
│ delivered: 850 ◄───┼─ Updated  │
│ opened: 250    ◄───┼─ by       │
│ clicked: 50    ◄───┼─ Webhooks │
│ bounced: 100   ◄───┤           │
│ failed: 50     ◄───┘           │
└─────────────────────────────────┘
```

### EmailLog Table
```
┌─────────────────────────────────┐
│ EmailLog                        │
├─────────────────────────────────┤
│ id                              │
│ messageId (from Mailgun)        │
│ recipient                       │
│ status: 'delivered'  ◄─ Webhook │
│ sentAt                          │
│ deliveredAt          ◄─ Webhook │
│ openedAt             ◄─ Webhook │
│ clickedAt            ◄─ Webhook │
│ error (if bounced)   ◄─ Webhook │
└─────────────────────────────────┘
```

### Contact Table
```
┌─────────────────────────────────┐
│ Contact                         │
├─────────────────────────────────┤
│ id                              │
│ email                           │
│ status: 'active'     ◄─ Webhook │
│ unsubscribed: false  ◄─ Webhook │
│ bounced: false       ◄─ Webhook │
│ notes                ◄─ Webhook │
└─────────────────────────────────┘
```

## 🎯 Configuration Layers

```
┌────────────────────────────────────────┐
│ Environment Variables (.env.local)      │
├────────────────────────────────────────┤
│ EMAIL_PROVIDER=mailgun                 │
│ MAILGUN_API_KEY=key-xxx                │
│ MAILGUN_DOMAIN=mg.yourdomain.com       │
│ MAILGUN_REGION=us                      │
│ EMAIL_FROM=noreply@mg.yourdomain.com   │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│ EmailService (email.service.ts)        │
├────────────────────────────────────────┤
│ - Reads environment variables          │
│ - Initializes Mailgun client           │
│ - Provides send() method               │
│ - Handles errors                       │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│ Application Code                       │
├────────────────────────────────────────┤
│ import { EmailService }                │
│ await EmailService.send({...})         │
└────────────────────────────────────────┘
```

## 🚀 Deployment Architecture

### Development
```
Local Machine
    │
    ├─ .env.local (local credentials)
    ├─ npm run dev
    └─ localhost:3000
        │
        └─→ Mailgun Sandbox Domain
            (testing only)
```

### Production
```
GitHub Repository
    │
    ▼
Vercel Auto-Deploy
    │
    ├─ Environment Variables
    │  ├─ EMAIL_PROVIDER
    │  ├─ MAILGUN_API_KEY
    │  ├─ MAILGUN_DOMAIN
    │  └─ MAILGUN_REGION
    │
    ▼
Production App
    │
    └─→ Mailgun Custom Domain
        (mg.yourdomain.com)
        │
        ├─→ Send emails
        ├─→ Track metrics
        └─→ Receive webhooks
```

## 📊 Monitoring Dashboard Flow

```
Mailgun Dashboard
    │
    ├─→ Analytics
    │   ├─ Sent: 10,000
    │   ├─ Delivered: 9,500 (95%)
    │   ├─ Opened: 2,000 (20%)
    │   ├─ Clicked: 500 (5%)
    │   └─ Bounced: 500 (5%)
    │
    ├─→ Logs (Real-time)
    │   └─ See every email sent
    │
    ├─→ Suppressions
    │   ├─ Bounces
    │   ├─ Complaints
    │   └─ Unsubscribes
    │
    └─→ Webhooks
        └─ Event delivery status

Your Dashboard (CallMaker24)
    │
    ├─→ Campaign Analytics
    │   └─ Same metrics from webhooks
    │
    └─→ Contact Status
        └─ Updated by webhooks
```

## 🔐 Security Flow

```
API Key Storage
    │
    ├─→ .env.local (development)
    │   └─ NOT committed to Git
    │
    └─→ Vercel Environment Variables (production)
        └─ Encrypted storage

Webhook Security
    │
    ├─→ Signature Verification
    │   ├─ Mailgun signs with HMAC-SHA256
    │   ├─ Your handler verifies signature
    │   └─ Reject if invalid
    │
    └─→ HTTPS Only
        └─ Webhooks only accept HTTPS endpoints
```

## 📈 Scalability

```
Small Scale (< 10,000 emails/month)
    └─→ Single Mailgun API call per email
        └─→ ~100ms per email
            └─→ Works fine

Medium Scale (10,000 - 100,000/month)
    └─→ Batch sending
        └─→ EmailService.sendBatch()
            └─→ Parallel API calls
                └─→ ~1000 emails/minute

Large Scale (> 100,000/month)
    └─→ Queue System (recommended)
        └─→ Bull/BullMQ
            └─→ Redis-backed queue
                └─→ Rate limiting
                    └─→ Retry logic
                        └─→ 10,000+ emails/minute
```

## 🎨 Email Template Flow

```
Template Design
    │
    ├─→ HTML + CSS
    ├─→ Personalization variables
    └─→ Test rendering
        │
        ▼
Store in Database/Files
    │
    ▼
Load Template
    │
    ├─→ Replace {{variables}}
    ├─→ Add tracking pixels
    └─→ Add unsubscribe link
        │
        ▼
EmailService.send()
    │
    ▼
Mailgun API
    │
    └─→ Delivery
```

---

## Summary

This architecture provides:

✅ **Reliable Email Delivery** via Mailgun
✅ **Real-time Tracking** via webhooks
✅ **Email Validation** to reduce bounces
✅ **Comprehensive Analytics** from webhooks + Mailgun dashboard
✅ **Scalable** from 100 to 1,000,000+ emails/month
✅ **Secure** with encrypted API keys and webhook verification
✅ **Production-Ready** with full error handling and monitoring

All components are already implemented and ready to use once you add your Mailgun credentials!
