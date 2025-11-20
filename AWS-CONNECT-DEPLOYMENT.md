# AWS Connect Deployment & Automation Guide

## 🚀 Quick Start - Automated Deployment

We've created multiple automated deployment scripts for different environments:

### Option 1: Node.js Script (Recommended)
```bash
node scripts/deploy-aws-connect.js
```

**Features:**
- Interactive prompts
- Creates instance
- Claims phone number
- Creates contact flows
- Updates .env.local automatically

### Option 2: PowerShell (Windows)
```powershell
.\scripts\deploy-aws-connect.ps1
```

### Option 3: Bash (Linux/Mac)
```bash
bash scripts/deploy-aws-connect.sh
```

### Option 4: Infrastructure as Code
```bash
# First deploy instance
node scripts/deploy-aws-connect.js

# Then deploy infrastructure (flows, queues, profiles)
node scripts/aws-connect-iac.js
```

## 📋 Prerequisites

### 1. AWS Credentials

**Option A: AWS CLI (Recommended)**
```bash
# Install AWS CLI
# Windows: Download from https://aws.amazon.com/cli/
# Mac: brew install awscli
# Linux: sudo apt-get install awscli

# Configure credentials
aws configure
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: ...
# Default region: us-east-1
# Default output format: json
```

**Option B: Environment Variables**
```bash
# Add to .env.local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### 2. IAM Permissions

Your AWS user needs these policies:
- `AmazonConnectFullAccess` (managed policy)

Or custom policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "connect:*",
        "ds:*",
        "iam:AttachRolePolicy",
        "iam:CreateRole",
        "iam:GetRole",
        "iam:PassRole",
        "kms:DescribeKey",
        "s3:CreateBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🎯 Deployment Steps

### Step 1: Deploy AWS Connect Instance

```bash
# Run deployment script
node scripts/deploy-aws-connect.js

# Follow prompts:
# 1. Enter instance alias (e.g., callmaker24-prod)
# 2. Enter display name (e.g., CallMaker24 Production)
# 3. Wait 2-3 minutes for instance creation
# 4. Choose to claim phone number
# 5. Configuration automatically saved to .env.local
```

**What it creates:**
- ✅ AWS Connect instance
- ✅ Phone number (claimed)
- ✅ Basic contact flow
- ✅ Default queue
- ✅ S3 buckets for storage

### Step 2: Deploy Infrastructure (Optional but Recommended)

```bash
# Deploy advanced infrastructure
node scripts/aws-connect-iac.js
```

**What it creates:**
- ✅ Multiple contact flows (Sales, Support, Outbound)
- ✅ Multiple queues (Sales, Support, Outbound)
- ✅ Routing profiles for agents
- ✅ Configuration saved to `scripts/aws-connect-config.json`

### Step 3: Test Configuration

```bash
# Verify everything is working
node scripts/test-aws-connect.js
```

**Expected output:**
```
✅ AWS Connect Connection Successful!
📊 Instance Details:
   • Instance Alias: callmaker24-prod
   • Status: ACTIVE
   • Inbound Calls: Enabled
   • Outbound Calls: Enabled
```

### Step 4: Sync to Vercel

```bash
# Get Vercel token
# Visit: https://vercel.com/account/tokens
# Create token with full access

# Set environment variables
export VERCEL_TOKEN=your_token_here
export VERCEL_PROJECT_NAME=callmaker24

# Sync configuration
node scripts/sync-to-vercel.js
```

**What it does:**
- ✅ Reads all AWS Connect variables from .env.local
- ✅ Uploads to Vercel project
- ✅ Triggers new deployment
- ✅ Available in production, preview, and development

## 🔧 Manual Deployment (Alternative)

If automated deployment fails, follow manual steps:

### 1. Create Instance Manually

1. Go to [AWS Connect Console](https://console.aws.amazon.com/connect/)
2. Click "Add an instance"
3. Choose "Amazon Connect" identity management
4. Set access URL (instance alias)
5. Create admin user
6. Enable inbound and outbound calls
7. Review and create

### 2. Get Instance Details

```bash
# List instances
aws connect list-instances --region us-east-1

# Describe instance
aws connect describe-instance \
  --instance-id YOUR_INSTANCE_ID \
  --region us-east-1
```

### 3. Claim Phone Number

```bash
# Search available numbers
aws connect search-available-phone-numbers \
  --target-arn YOUR_INSTANCE_ARN \
  --phone-number-country-code US \
  --phone-number-type DID \
  --region us-east-1

# Claim number
aws connect claim-phone-number \
  --target-arn YOUR_INSTANCE_ARN \
  --phone-number +18005551234 \
  --region us-east-1
```

### 4. Create Contact Flow

In AWS Connect Console:
1. Go to Routing → Contact flows
2. Create new flow
3. Add blocks: Entry → Play prompt → Transfer to queue → End
4. Publish
5. Copy Contact Flow ID from URL

## 🔄 CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy-aws-connect.yml`:

```yaml
name: Deploy AWS Connect

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Deploy AWS Connect
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
        run: |
          node scripts/aws-connect-iac.js
      
      - name: Sync to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_NAME: callmaker24
        run: |
          node scripts/sync-to-vercel.js
```

### Terraform (Advanced)

Create `terraform/aws-connect.tf`:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_connect_instance" "main" {
  identity_management_type = "CONNECT_MANAGED"
  instance_alias          = var.instance_alias
  inbound_calls_enabled   = true
  outbound_calls_enabled  = true
}

resource "aws_connect_contact_flow" "main" {
  instance_id = aws_connect_instance.main.id
  name        = "CallMaker24-Main"
  type        = "CONTACT_FLOW"
  
  content = jsonencode({
    Version     = "2019-10-30"
    StartAction = "welcome"
    Actions = [
      {
        Identifier = "welcome"
        Type       = "MessageParticipant"
        Parameters = {
          Text = "Thank you for calling."
        }
        Transitions = {
          NextAction = "end"
        }
      },
      {
        Identifier = "end"
        Type       = "DisconnectParticipant"
      }
    ]
  })
}

output "instance_id" {
  value = aws_connect_instance.main.id
}

output "instance_arn" {
  value = aws_connect_instance.main.arn
}
```

## 📊 Deployment Verification

### Check Instance Status
```bash
aws connect describe-instance \
  --instance-id $AWS_CONNECT_INSTANCE_ID \
  --region $AWS_REGION
```

### List Phone Numbers
```bash
aws connect list-phone-numbers-v2 \
  --target-arn $AWS_CONNECT_INSTANCE_ARN \
  --region $AWS_REGION
```

### List Contact Flows
```bash
aws connect list-contact-flows \
  --instance-id $AWS_CONNECT_INSTANCE_ID \
  --region $AWS_REGION
```

### Test API Endpoint
```bash
curl -X POST http://localhost:3000/api/call-center/aws-connect/init \
  -H "Content-Type: application/json"
```

## 🚨 Troubleshooting

### Deployment Script Fails

**Error: "ResourceConflictException"**
- Instance alias already exists
- Choose a different alias

**Error: "AccessDeniedException"**
- IAM user lacks permissions
- Add `AmazonConnectFullAccess` policy

**Error: "ServiceQuotaExceededException"**
- Account limit reached
- Request quota increase in AWS Service Quotas

### Phone Number Claiming Fails

**Error: "No available numbers"**
- Try different region
- Or claim manually in console

### Vercel Sync Fails

**Error: "Unauthorized"**
- Invalid VERCEL_TOKEN
- Get new token from https://vercel.com/account/tokens

**Error: "Project not found"**
- Wrong VERCEL_PROJECT_NAME
- Check project name in Vercel dashboard

## 🎯 Best Practices

### 1. Use Separate Instances
- **Development**: `callmaker24-dev`
- **Staging**: `callmaker24-staging`
- **Production**: `callmaker24-prod`

### 2. Version Control
- Store contact flow JSON in git
- Use infrastructure as code
- Document changes

### 3. Testing
- Test contact flows before production
- Use separate test phone numbers
- Monitor call quality metrics

### 4. Security
- Rotate AWS credentials regularly
- Use IAM roles when possible
- Enable CloudTrail logging
- Restrict access by IP

### 5. Monitoring
- Set up CloudWatch alarms
- Monitor call quality metrics
- Track cost and usage
- Review logs regularly

## 📈 Scaling Considerations

### Multi-Region Deployment
```bash
# Deploy to multiple regions
regions=("us-east-1" "us-west-2" "eu-west-1")

for region in "${regions[@]}"; do
  export AWS_REGION=$region
  node scripts/deploy-aws-connect.js
done
```

### Load Balancing
- Use Amazon Connect Task routing
- Distribute calls across regions
- Implement failover logic

### Cost Optimization
- Use scheduled hours of operation
- Implement IVR self-service
- Review and optimize contact flows
- Monitor concurrent call limits

## 🔗 Additional Resources

- **AWS Connect Documentation**: https://docs.aws.amazon.com/connect/
- **AWS CLI Reference**: https://docs.aws.amazon.com/cli/latest/reference/connect/
- **Contact Flow Language**: https://docs.aws.amazon.com/connect/latest/adminguide/contact-flow-language.html
- **Best Practices**: https://docs.aws.amazon.com/connect/latest/adminguide/best-practices.html

## 📞 Support

If you encounter issues:
1. Check deployment logs
2. Review AWS CloudWatch logs
3. Test with `scripts/test-aws-connect.js`
4. Verify IAM permissions
5. Check AWS Service Health Dashboard
