# AWS Connect Integration Setup Guide

## Overview
CallMaker24 integrates with Amazon Connect to provide cloud-based contact center capabilities.

## Prerequisites
- AWS Account with Amazon Connect access
- AWS Connect Instance created
- IAM User with appropriate permissions

## Environment Variables

Add these to your `.env.local` file:

```env
# AWS Connect Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# AWS Connect Instance Details
AWS_CONNECT_INSTANCE_ID=your-instance-id
AWS_CONNECT_INSTANCE_ARN=arn:aws:connect:us-east-1:123456789012:instance/your-instance-id
AWS_CONNECT_INSTANCE_ALIAS=your-instance-alias

# Phone Numbers
AWS_CONNECT_PHONE_NUMBER=+1234567890

# Contact Flow Configuration
AWS_CONNECT_CONTACT_FLOW_ID=your-contact-flow-id
AWS_CONNECT_QUEUE_ID=your-queue-id
```

## AWS IAM Permissions

Create an IAM user with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "connect:StartOutboundVoiceContact",
        "connect:StopContact",
        "connect:GetContactAttributes",
        "connect:UpdateContactAttributes",
        "connect:DescribeUser",
        "connect:PutUserStatus",
        "connect:ListQueues",
        "connect:ListContactFlows",
        "connect:GetMetricData"
      ],
      "Resource": "*"
    }
  ]
}
```

## Setup Steps

### 1. Create AWS Connect Instance
1. Go to AWS Console → Amazon Connect
2. Click "Add an instance"
3. Choose identity management (default is Amazon Connect user management)
4. Set instance alias (e.g., "callmaker24")
5. Create administrator account
6. Configure telephony options (enable inbound/outbound calls)
7. Review and create instance

### 2. Claim Phone Number
1. In AWS Connect dashboard, go to "Channels" → "Phone numbers"
2. Click "Claim a number"
3. Select country and number type (DID or Toll-free)
4. Choose a phone number
5. Associate with a contact flow

### 3. Create Contact Flow
1. Go to "Routing" → "Contact flows"
2. Create new contact flow for outbound calls
3. Add blocks:
   - Play prompt (greeting)
   - Set queue
   - Transfer to queue
4. Save and publish
5. Note the Contact Flow ID

### 4. Create Queue
1. Go to "Routing" → "Queues"
2. Create new queue (e.g., "Sales Queue")
3. Set hours of operation
4. Configure outbound caller ID
5. Note the Queue ID

### 5. Install AWS SDK
```bash
npm install aws-sdk
```

### 6. Update API Routes
The following API routes are ready for AWS Connect:
- `/api/call-center/aws-connect/init` - Initialize connection
- `/api/call-center/aws-connect/make-call` - Start outbound call
- `/api/call-center/aws-connect/end-call` - End active call
- `/api/call-center/aws-connect/agent-status` - Update/get agent status

Uncomment the AWS SDK code in each route file.

## Contact Control Panel (CCP)

To embed the AWS Connect CCP in your application:

```javascript
// In production, add this to your page
import 'amazon-connect-streams';

connect.core.initCCP(containerDiv, {
  ccpUrl: 'https://your-instance.my.connect.aws/ccp-v2/',
  loginPopup: true,
  softphone: {
    allowFramedSoftphone: true
  }
});
```

## Testing

### Development Mode
The call center currently uses mock responses for testing without AWS credentials.

### Production Mode
1. Add all environment variables to Vercel
2. Uncomment AWS SDK code in API routes
3. Deploy to production
4. Test with real phone numbers

## Features Enabled

✅ Outbound calling via AWS Connect
✅ Agent status management (Available, Offline, On Call)
✅ Real-time call status updates
✅ Connection status indicator
✅ Call recording (when enabled in AWS Connect)
✅ Queue management
✅ Contact flow routing

## Monitoring

AWS Connect provides built-in metrics:
- Real-time agent metrics
- Queue metrics
- Historical reports
- Call recordings
- Contact trace records

Access these via:
- AWS Connect Console → Metrics and quality
- CloudWatch for detailed logs
- Contact Lens for analytics

## Cost Considerations

AWS Connect Pricing (as of 2025):
- Pay-as-you-go, no upfront costs
- ~$0.018 per minute for voice calls
- Service usage fees
- Phone number costs ($0.03-0.50/day depending on type)
- Recording storage (S3 costs)

## Security

- All calls encrypted in transit (TLS)
- Call recordings encrypted at rest (KMS)
- IAM-based access control
- VPC integration available
- HIPAA compliant (if configured)

## Support

For AWS Connect specific issues:
- AWS Support Center
- AWS Connect Documentation: https://docs.aws.amazon.com/connect/
- CallMaker24 Support: support@callmaker24.com
