# Email & SMS Marketing Platform

A production-ready, full-stack marketing automation platform built with Next.js, featuring email marketing, SMS campaigns, AI-powered chatbot, IVR system, and comprehensive CRM functionality.

![Platform Screenshot](docs/screenshot.png)

## 🚀 Features

### Core Marketing Features
- **Email Marketing**: Campaign builder, A/B testing, scheduling, analytics
- **SMS Marketing**: Two-way messaging, campaign automation, opt-in/opt-out management
- **AI Content Generator**: OpenAI-powered copy generation for emails and SMS
- **Customer CRM**: Complete customer management with segmentation and tagging
- **Analytics & Reporting**: Comprehensive dashboards, CSV/PDF exports

### Communication Features
- **AI Chatbot**: Intelligent customer support with live agent handoff
- **Helpdesk**: Ticket management and conversation tracking
- **IVR System**: Twilio-powered voice call routing and recording
- **Knowledge Base**: Self-service support articles

### Business Features
- **Multi-tier Subscriptions**: Stripe-powered payment processing
- **Credit System**: Email, SMS, and AI usage tracking
- **API Integration**: RESTful API with webhooks
- **E-commerce Connectors**: Shopify and WooCommerce integration

## 📋 Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- PostgreSQL database (via Neon, Supabase, or PlanetScale)
- Vercel account (for deployment)

### Required API Keys
- Resend or SendGrid (email delivery)
- Twilio (SMS and Voice)
- OpenAI (AI features)
- Stripe (payments)
- Google/Facebook OAuth credentials

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd callmaker24-vercel
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the `.env.example` file to `.env`:

```bash
copy .env.example .env
```

Then fill in your environment variables:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/marketing_platform
DIRECT_URL=postgresql://user:password@localhost:5432/marketing_platform

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token
```

### 4. Set Up the Database

Run Prisma migrations to create your database schema:

```bash
npm run prisma:generate
npm run prisma:push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚢 Deployment to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Push Code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables**
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add all variables from your `.env` file
   - Make sure to add them for all environments (Production, Preview, Development)

4. **Set Up Database**
   - Create PostgreSQL database (Neon, Supabase, or PlanetScale)
   - Add `DATABASE_URL` and `DIRECT_URL` to Vercel environment variables
   - Run migrations: `npx prisma migrate deploy`

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## 📁 Project Structure

```
callmaker24-vercel/
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── api/                  # API routes
│   │   │   ├── auth/             # Authentication endpoints
│   │   │   ├── customers/        # Customer management
│   │   │   ├── email-campaigns/  # Email marketing
│   │   │   ├── sms-campaigns/    # SMS marketing
│   │   │   ├── chat/             # Chatbot & helpdesk
│   │   │   ├── voice/            # IVR & voice calls
│   │   │   ├── ai/               # AI content generation
│   │   │   ├── analytics/        # Analytics & reporting
│   │   │   └── webhooks/         # Webhook handlers
│   │   ├── dashboard/            # Main dashboard
│   │   ├── auth/                 # Auth pages
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page
│   ├── components/               # React components
│   │   ├── ui/                   # UI components
│   │   ├── dashboard/            # Dashboard components
│   │   ├── email/                # Email builder
│   │   ├── chat/                 # Chat widget
│   │   └── providers.tsx         # App providers
│   ├── lib/                      # Utilities
│   │   ├── prisma.ts             # Prisma client
│   │   ├── auth.ts               # NextAuth config
│   │   └── utils.ts              # Helper functions
│   ├── services/                 # Business logic
│   │   ├── email.service.ts      # Email operations
│   │   ├── sms.service.ts        # SMS operations
│   │   ├── ai.service.ts         # AI integration
│   │   ├── voice.service.ts      # Voice/IVR
│   │   └── payment.service.ts    # Stripe integration
│   ├── types/                    # TypeScript types
│   └── styles/                   # Global styles
├── prisma/
│   └── schema.prisma             # Database schema
├── public/                       # Static assets
├── tests/                        # Test files
├── docs/                         # Documentation
├── .env.example                  # Environment template
├── vercel.json                   # Vercel configuration
├── next.config.js                # Next.js config
├── tailwind.config.ts            # Tailwind config
└── package.json                  # Dependencies
```

## 🔌 API Documentation

### Authentication

All API endpoints (except auth endpoints) require authentication via NextAuth session.

### Endpoints

#### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create a customer
- `GET /api/customers/:id` - Get customer details
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/import` - Bulk import customers

#### Email Campaigns
- `GET /api/email-campaigns` - List campaigns
- `POST /api/email-campaigns` - Create campaign
- `GET /api/email-campaigns/:id` - Get campaign details
- `PATCH /api/email-campaigns/:id` - Update campaign
- `POST /api/email-campaigns/:id/send` - Send campaign
- `GET /api/email-campaigns/:id/analytics` - Get campaign analytics

#### SMS Campaigns
- `GET /api/sms-campaigns` - List SMS campaigns
- `POST /api/sms-campaigns` - Create SMS campaign
- `POST /api/sms-campaigns/:id/send` - Send SMS campaign

#### AI Content Generation
- `POST /api/ai/generate` - Generate marketing content
- `POST /api/ai/chat` - AI chatbot response

#### Voice/IVR
- `POST /api/voice/call` - Initiate call
- `POST /api/voice/ivr` - IVR webhook
- `GET /api/voice/calls` - List calls

#### Analytics
- `GET /api/analytics/dashboard` - Get dashboard stats
- `GET /api/analytics/campaigns` - Campaign performance
- `POST /api/analytics/export` - Export report

### Webhooks

#### Stripe Webhooks
- `POST /api/webhooks/stripe` - Handle Stripe events

#### Twilio Webhooks
- `POST /api/webhooks/twilio/sms` - Incoming SMS
- `POST /api/webhooks/twilio/voice` - Voice status updates

## 🎨 Visual Design

The platform uses a modern, clean design inspired by mybogolo.com:

- **Primary Color**:   sky Blue (#0ea5e9)
- **Secondary Color**: beige (#d946ef)
- **Accent Color**: Orange (#f97316)
- **Typography**: Inter (body), Poppins (headings)

## 🔒 Security Features

- CSRF protection
- XSS prevention
- SQL injection prevention (Prisma ORM)
- Rate limiting on API endpoints
- Multi-factor authentication
- Role-based access control
- Secure session management
- Environment variable encryption

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Run E2E Tests
```bash
npm run test:e2e
```

## 📊 Database Management

### View Database
```bash
npm run prisma:studio
```

### Create Migration
```bash
npx prisma migrate dev --name migration_name
```

### Reset Database
```bash
npx prisma migrate reset
```

## 🔧 Configuration

### Subscription Tiers

Edit Stripe price IDs in `.env`:
- `STRIPE_PRICE_ID_BASIC` - Basic tier
- `STRIPE_PRICE_ID_PRO` - Pro tier
- `STRIPE_PRICE_ID_ENTERPRISE` - Enterprise tier

### Feature Flags

Enable/disable features in `.env`:
```env
FEATURE_AI_ENABLED=true
FEATURE_IVR_ENABLED=true
FEATURE_MULTI_TENANT=false
FEATURE_TWO_FACTOR_AUTH=true
```

## 📈 Monitoring & Logging

- **Vercel Analytics**: Built-in analytics
- **Sentry**: Error tracking (configure `SENTRY_DSN`)
- **Logtail**: Log management (configure `LOGTAIL_SOURCE_TOKEN`)

## 🤝 Support

For issues and questions:
- Create an issue in the repository
- Email: support@yourdomain.com
- Documentation: [docs/](docs/)

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- Twilio for communication APIs
- OpenAI for AI capabilities
- Stripe for payment processing

---

Built with ❤️ using Next.js and deployed on Vercel
