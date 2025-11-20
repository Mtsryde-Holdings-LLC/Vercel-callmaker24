# AWS Connect - Quick Deployment Reference

## 🚀 One-Command Deployment

```bash
# Automated deployment (recommended)
node scripts/deploy-aws-connect.js
```

## 📋 Prerequisites Checklist

- [ ] AWS account with billing enabled
- [ ] AWS CLI installed and configured
- [ ] IAM user with AmazonConnectFullAccess
- [ ] Node.js 18+ installed

## ⚡ Quick Commands

### Deploy Infrastructure
```bash
node scripts/deploy-aws-connect.js        # Create instance
node scripts/aws-connect-iac.js           # Deploy flows/queues
node scripts/test-aws-connect.js          # Test configuration
```

### Sync to Vercel
```bash
export VERCEL_TOKEN=your_token
export VERCEL_PROJECT_NAME=callmaker24
node scripts/sync-to-vercel.js
```

### AWS CLI Commands
```bash
# List instances
aws connect list-instances --region us-east-1

# Describe instance
aws connect describe-instance \
  --instance-id $AWS_CONNECT_INSTANCE_ID \
  --region us-east-1

# List phone numbers
aws connect list-phone-numbers-v2 \
  --target-arn $AWS_CONNECT_INSTANCE_ARN \
  --region us-east-1

# List contact flows
aws connect list-contact-flows \
  --instance-id $AWS_CONNECT_INSTANCE_ID \
  --region us-east-1
```

## 📊 What Gets Created

| Resource | Purpose | Cost |
|----------|---------|------|
| Connect Instance | Call center infrastructure | Usage-based |
| Phone Number | Inbound/outbound calling | ~$0.03/day |
| Contact Flows | IVR/call routing | Included |
| Queues | Call distribution | Included |
| S3 Buckets | Recording storage | ~$0.023/GB |

## 🔑 Required Environment Variables

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_CONNECT_INSTANCE_ID=12345678-1234-1234-1234-123456789012
AWS_CONNECT_INSTANCE_ARN=arn:aws:connect:us-east-1:123456789012:instance/...
AWS_CONNECT_INSTANCE_ALIAS=my-company
AWS_CONNECT_CONTACT_FLOW_ID=12345678-1234-1234-1234-123456789012
AWS_CONNECT_QUEUE_ID=12345678-1234-1234-1234-123456789012
AWS_CONNECT_PHONE_NUMBER=+18005551234
```

## 🎯 Deployment Flow

```
1. Run deploy script
   ↓
2. Create AWS Connect instance (2-3 min)
   ↓
3. Claim phone number
   ↓
4. Create contact flow
   ↓
5. Create queue
   ↓
6. Update .env.local
   ↓
7. Test configuration
   ↓
8. Sync to Vercel
   ↓
9. Deploy application
```

## 🔧 Troubleshooting Quick Fixes

| Error | Fix |
|-------|-----|
| "ResourceConflictException" | Use different instance alias |
| "AccessDeniedException" | Add AmazonConnectFullAccess policy |
| "No available numbers" | Try different region or claim manually |
| "Invalid credentials" | Run `aws configure` |

## 💡 Pro Tips

1. **Multi-environment setup**
   ```bash
   # Development
   INSTANCE_ALIAS=callmaker24-dev node scripts/deploy-aws-connect.js
   
   # Production
   INSTANCE_ALIAS=callmaker24-prod node scripts/deploy-aws-connect.js
   ```

2. **Backup configuration**
   ```bash
   # Export configuration
   aws connect describe-instance \
     --instance-id $AWS_CONNECT_INSTANCE_ID \
     > config-backup.json
   ```

3. **Monitor costs**
   ```bash
   # View current month costs
   aws ce get-cost-and-usage \
     --time-period Start=2025-11-01,End=2025-11-30 \
     --granularity MONTHLY \
     --metrics BlendedCost \
     --filter file://filter.json
   ```

## 📞 Test Outbound Call

```bash
curl -X POST http://localhost:3000/api/call-center/aws-connect/make-call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+14155551234",
    "contactFlowId": "'"$AWS_CONNECT_CONTACT_FLOW_ID"'"
  }'
```

## 🔗 Useful Links

- **AWS Console**: https://console.aws.amazon.com/connect/
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Get Vercel Token**: https://vercel.com/account/tokens
- **AWS CLI Install**: https://aws.amazon.com/cli/
- **Documentation**: See `AWS-CONNECT-DEPLOYMENT.md`
