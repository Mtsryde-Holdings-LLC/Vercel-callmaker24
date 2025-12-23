# AWS Amplify Deployment Guide

## ⚠️ Current Status: **REQUIRES CONFIGURATION**

Your CallMaker24 platform is currently **optimized for Vercel**. To deploy to AWS Amplify, follow this comprehensive migration guide.

---

## 🎯 Prerequisites

### Required AWS Services

- ✅ **AWS Amplify Hosting** - For Next.js application
- ✅ **Amazon RDS (PostgreSQL)** - Database with connection pooling
- ✅ **Amazon S3** - File storage (replace Vercel Blob)
- ✅ **Amazon SES** - Email sending (already configured)
- ✅ **AWS Secrets Manager** - Secure credential storage
- ✅ **Amazon CloudFront** - CDN and image optimization
- ✅ **AWS Lambda** - Serverless functions (API routes)

### Cost Estimate (Monthly)

- Amplify Hosting: $15-50 (based on traffic)
- RDS PostgreSQL (t3.micro): $15-25
- S3 Storage: $1-5
- SES Email: $0.10 per 1,000 emails
- Lambda: $0.20 per million requests
- **Total Estimated**: $50-100/month (small-medium traffic)

---

## 📝 Step-by-Step Migration

### Phase 1: Code Modifications

#### 1.1 Update next.config.js

Replace Vercel-specific configuration:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove: output: "standalone",
  images: {
    domains: [
      "YOUR-BUCKET.s3.amazonaws.com",
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amplifyapp.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Fix TypeScript errors for production
  },
  experimental: {
    skipTrailingSlashRedirect: true,
  },
  // Amplify-specific
  trailingSlash: false,
  swcMinify: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

#### 1.2 Replace Vercel Blob Storage

**Current (Vercel Blob):**

```typescript
import { put } from "@vercel/blob";
await put("filename", file, { access: "public" });
```

**New (AWS S3):**

```bash
npm install @aws-sdk/client-s3
```

Create `src/lib/s3.ts`:

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET_NAME!;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: file,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
}
```

#### 1.3 Update Database Connection

Add connection pooling for Lambda:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Connection pooling for serverless
export async function connectDB() {
  if (!prisma) {
    throw new Error("Prisma client not initialized");
  }
  await prisma.$connect();
}

export async function disconnectDB() {
  await prisma.$disconnect();
}
```

#### 1.4 Fix TypeScript Errors

```bash
# Enable strict TypeScript checking
npx tsc --noEmit

# Fix all errors before deployment
```

---

### Phase 2: AWS Infrastructure Setup

#### 2.1 Create RDS PostgreSQL Database

```bash
# AWS CLI
aws rds create-db-instance \
  --db-instance-identifier callmaker24-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --publicly-accessible true
```

**Or use AWS Console:**

1. Go to RDS → Create database
2. Choose PostgreSQL
3. Template: Free tier (or Production for high availability)
4. Settings:
   - DB name: `callmaker24`
   - Master username: `admin`
   - Auto-generate password
5. Connectivity:
   - Public access: Yes (for development)
   - Security group: Allow port 5432 from your IPs + Amplify
6. Create database

**Get connection string:**

```
postgresql://admin:password@callmaker24-db.xxxxxxxx.us-east-1.rds.amazonaws.com:5432/callmaker24?sslmode=require
```

#### 2.2 Create S3 Bucket for File Storage

```bash
aws s3 mb s3://callmaker24-uploads --region us-east-1

# Enable public access for uploaded files
aws s3api put-bucket-policy --bucket callmaker24-uploads --policy file://bucket-policy.json
```

**bucket-policy.json:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::callmaker24-uploads/*"
    }
  ]
}
```

#### 2.3 Create IAM User for Application

```bash
aws iam create-user --user-name callmaker24-app

# Attach policies
aws iam attach-user-policy --user-name callmaker24-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-user-policy --user-name callmaker24-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess

# Create access keys
aws iam create-access-key --user-name callmaker24-app
```

**Save the Access Key ID and Secret Access Key.**

#### 2.4 Store Secrets in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name callmaker24/production \
  --secret-string '{
    "DATABASE_URL": "postgresql://...",
    "NEXTAUTH_SECRET": "your-secret-here",
    "STRIPE_SECRET_KEY": "sk_live_...",
    "TWILIO_AUTH_TOKEN": "your-token",
    "OPENAI_API_KEY": "sk-..."
  }'
```

---

### Phase 3: Amplify Console Setup

#### 3.1 Connect Repository

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app" → "Host web app"**
3. Choose **GitHub** (or your Git provider)
4. Authorize AWS Amplify to access your repository
5. Select repository: `Mtsryde-Holdings-LLC/Vercel-callmaker24`
6. Select branch: `main`

#### 3.2 Configure Build Settings

Amplify will detect Next.js automatically, but verify:

- **App name**: `callmaker24`
- **Environment**: `production`
- **Build settings**: Use the `amplify.yml` file from this repo

#### 3.3 Add Environment Variables

In Amplify Console → App settings → Environment variables, add **ALL 70+ variables**:

**Database:**

```
DATABASE_URL=postgresql://admin:password@callmaker24-db.xxx.us-east-1.rds.amazonaws.com:5432/callmaker24?sslmode=require
DIRECT_URL=postgresql://admin:password@callmaker24-db.xxx.us-east-1.rds.amazonaws.com:5432/callmaker24?sslmode=require
```

**Application:**

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://main.xxxxxxxxxx.amplifyapp.com
NEXT_PUBLIC_APP_NAME=CallMaker24
```

**Authentication:**

```
NEXTAUTH_URL=https://main.xxxxxxxxxx.amplifyapp.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

**AWS Services:**

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxx
AWS_S3_BUCKET_NAME=callmaker24-uploads
AWS_SES_FROM_EMAIL=noreply@callmaker24.com
```

**Third-Party Services:**

```
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview

# Email
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.callmaker24.com
```

**Copy all other variables from your `.env.example` file.**

#### 3.4 Configure Advanced Settings

**Build settings:**

- Node version: `18` or `20`
- Package manager: `npm`
- Build command: `npm run build`
- Base directory: `/`
- Output directory: `.next`

**Environment:**

- Add `AMPLIFY_DIFF_DEPLOY=false` to disable differential deployments (optional)
- Add `AMPLIFY_MONOREPO_APP_ROOT=/` if using monorepo

#### 3.5 Deploy Application

1. Click **"Save and deploy"**
2. Wait for build (5-10 minutes first time)
3. Monitor build logs for errors

---

### Phase 4: Post-Deployment Configuration

#### 4.1 Run Database Migrations

After first deployment, run migrations:

```bash
# Clone your repo locally
git clone https://github.com/Mtsryde-Holdings-LLC/Vercel-callmaker24.git
cd Vercel-callmaker24

# Install dependencies
npm install

# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://admin:password@callmaker24-db.xxx.us-east-1.rds.amazonaws.com:5432/callmaker24?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Or push schema directly
npx prisma db push
```

#### 4.2 Configure Custom Domain

1. Amplify Console → Domain management
2. Click **"Add domain"**
3. Enter your domain: `callmaker24.com`
4. Configure DNS:
   - Add CNAME record:
     - Name: `www`
     - Value: `<your-amplify-domain>.amplifyapp.com`
   - Add ANAME/ALIAS record (or A record):
     - Name: `@`
     - Value: Point to Amplify domain
5. Wait for SSL certificate (automatic via ACM)

#### 4.3 Update Webhook URLs

Update all third-party service webhooks to new Amplify domain:

**Stripe webhooks:**

```
https://callmaker24.com/api/webhooks/stripe
```

**Twilio webhooks:**

```
SMS: https://callmaker24.com/api/sms/webhook
Voice: https://callmaker24.com/api/voice/ivr
Status: https://callmaker24.com/api/voice/status
```

**Shopify webhooks:**

```
Orders: https://callmaker24.com/api/integrations/shopify/webhooks
```

#### 4.4 Configure CloudFront for Image Optimization

1. Go to CloudFront console
2. Find your Amplify distribution (auto-created)
3. Edit settings:
   - Enable compression: Yes
   - Cache policy: CachingOptimized
   - Origin request policy: CORS-CustomOrigin
4. Invalidate cache after changes:
   ```bash
   aws cloudfront create-invalidation --distribution-id EXXXXXXXXXX --paths "/*"
   ```

#### 4.5 Set Up Monitoring

**CloudWatch Logs:**

- Lambda function logs (API routes)
- Application logs via console.log

**CloudWatch Alarms:**

```bash
# Create alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name callmaker24-high-errors \
  --alarm-description "Alert when error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## 🔒 Security Configuration

### 1. Update Security Group (RDS)

Allow inbound PostgreSQL connections:

- Port: 5432
- Source: Amplify VPC CIDR (or 0.0.0.0/0 for development)

### 2. Enable AWS WAF (Optional but recommended)

Protect against DDoS and common attacks:

```bash
aws wafv2 create-web-acl \
  --name callmaker24-waf \
  --scope CLOUDFRONT \
  --default-action Allow={} \
  --rules file://waf-rules.json
```

### 3. Rotate Secrets Regularly

Set up automatic rotation in Secrets Manager:

```bash
aws secretsmanager rotate-secret \
  --secret-id callmaker24/production \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:xxx:function:SecretsManagerRotation
```

---

## 📊 Testing Checklist

After deployment, test all features:

- [ ] Homepage loads correctly
- [ ] User authentication (sign up, login, logout)
- [ ] Dashboard access with RBAC
- [ ] Email campaign creation and sending
- [ ] SMS sending via Twilio
- [ ] AI chatbot functionality
- [ ] IVR call flow
- [ ] Stripe payment processing
- [ ] Shopify integration sync
- [ ] File uploads to S3
- [ ] Loyalty portal access
- [ ] Image optimization via CloudFront
- [ ] All API endpoints responding
- [ ] Webhooks receiving events
- [ ] Database queries performing well

---

## 🚀 Performance Optimization

### 1. Enable Connection Pooling

Use PgBouncer or RDS Proxy for Lambda connections:

```bash
aws rds create-db-proxy \
  --db-proxy-name callmaker24-proxy \
  --engine-family POSTGRESQL \
  --auth '[{"AuthScheme":"SECRETS","SecretArn":"arn:aws:secretsmanager:xxx"}]' \
  --role-arn arn:aws:iam::xxx:role/RDSProxyRole \
  --vpc-subnet-ids subnet-xxx subnet-yyy
```

Update DATABASE_URL to use proxy endpoint.

### 2. Configure Caching

Add caching headers to API routes:

```typescript
export async function GET(request: Request) {
  // ... your logic

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=60, stale-while-revalidate",
    },
  });
}
```

### 3. Enable ISR (Incremental Static Regeneration)

For frequently accessed pages:

```typescript
// app/dashboard/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds
```

---

## 💰 Cost Optimization

### 1. Use Reserved Instances for RDS

Save up to 60% on database costs:

```bash
aws rds purchase-reserved-db-instances-offering \
  --reserved-db-instances-offering-id xxx \
  --reserved-db-instance-id callmaker24-db-reserved
```

### 2. Enable S3 Lifecycle Policies

Move old files to cheaper storage:

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket callmaker24-uploads \
  --lifecycle-configuration file://lifecycle.json
```

### 3. Configure Lambda Provisioned Concurrency

For high-traffic API routes (optional):

```bash
aws lambda put-provisioned-concurrency-config \
  --function-name callmaker24-api \
  --provisioned-concurrent-executions 5
```

---

## 🔧 Troubleshooting

### Build Failures

**Error: "Cannot find module '@prisma/client'"**

```bash
# Solution: Add to amplify.yml
backend:
  phases:
    build:
      commands:
        - npx prisma generate
```

**Error: "Database connection failed"**

- Verify DATABASE_URL is correct
- Check RDS security group allows inbound from Amplify
- Confirm database is publicly accessible (for initial setup)

### Runtime Errors

**Error: "Function timeout"**

- Increase Lambda timeout in Amplify settings
- Optimize database queries with indexes
- Use connection pooling (RDS Proxy)

**Error: "Out of memory"**

- Increase Lambda memory allocation
- Optimize image sizes
- Use streaming for large responses

---

## 📚 Additional Resources

- [AWS Amplify Hosting Documentation](https://docs.amplify.aws/hosting/)
- [Next.js on AWS Amplify](https://aws.amazon.com/blogs/mobile/host-a-next-js-app-with-aws-amplify/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [Lambda Cold Start Optimization](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

---

## ✅ Deployment Checklist

- [ ] Code modifications complete (S3, no standalone output)
- [ ] TypeScript errors fixed
- [ ] amplify.yml created
- [ ] RDS PostgreSQL database created
- [ ] S3 bucket created and configured
- [ ] IAM user created with access keys
- [ ] Secrets stored in Secrets Manager
- [ ] Amplify app created and connected to GitHub
- [ ] All 70+ environment variables added
- [ ] First deployment successful
- [ ] Database migrations run
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] All webhooks updated
- [ ] CloudFront configured
- [ ] Monitoring and alarms set up
- [ ] All features tested and working
- [ ] Performance optimized
- [ ] Security hardened

---

## 🎯 Summary

**Effort Required**: High (2-4 days of work)  
**Complexity**: Medium-High  
**Cost**: $50-100/month  
**Recommendation**:

- **Stay on Vercel** if you want zero-config deployment
- **Migrate to Amplify** if you need:
  - Full AWS integration
  - More control over infrastructure
  - Lower costs at scale
  - Compliance requirements for AWS

Your application is **production-ready for Vercel** but requires significant configuration for AWS Amplify deployment.
