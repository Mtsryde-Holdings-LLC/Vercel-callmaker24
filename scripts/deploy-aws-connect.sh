#!/bin/bash
# AWS Connect Deployment Script (Bash version for Unix/Linux)
# Run with: bash scripts/deploy-aws-connect.sh

set -e

echo "🚀 AWS Connect Automated Deployment"
echo "===================================="

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    echo "Install: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI found"

# Check credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

echo "✅ AWS credentials valid"

# Get configuration
read -p "Enter instance alias (e.g., callmaker24): " INSTANCE_ALIAS
read -p "Enter AWS region [us-east-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "📋 Configuration:"
echo "   Instance Alias: $INSTANCE_ALIAS"
echo "   Region: $AWS_REGION"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "⏳ Creating AWS Connect instance..."

# Create instance
INSTANCE_ID=$(aws connect create-instance \
    --identity-management-type CONNECT_MANAGED \
    --instance-alias "$INSTANCE_ALIAS" \
    --inbound-calls-enabled \
    --outbound-calls-enabled \
    --region "$AWS_REGION" \
    --output text \
    --query 'Id')

if [ $? -ne 0 ]; then
    echo "❌ Failed to create instance"
    exit 1
fi

echo "✅ Instance created: $INSTANCE_ID"

# Wait for instance to be active
echo "⏳ Waiting for instance to become active..."
for i in {1..60}; do
    STATUS=$(aws connect describe-instance \
        --instance-id "$INSTANCE_ID" \
        --region "$AWS_REGION" \
        --query 'Instance.InstanceStatus' \
        --output text)
    
    if [ "$STATUS" == "ACTIVE" ]; then
        echo "✅ Instance is active!"
        break
    fi
    
    echo -n "."
    sleep 3
done

# Get instance details
echo ""
echo "📊 Getting instance details..."

INSTANCE_ARN=$(aws connect describe-instance \
    --instance-id "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'Instance.Arn' \
    --output text)

echo "   Instance ARN: $INSTANCE_ARN"

# Search for available phone numbers
echo ""
echo "📱 Searching for available phone numbers..."

PHONE_NUMBER=$(aws connect search-available-phone-numbers \
    --target-arn "$INSTANCE_ARN" \
    --phone-number-country-code US \
    --phone-number-type DID \
    --region "$AWS_REGION" \
    --query 'AvailableNumbersList[0].PhoneNumber' \
    --output text 2>/dev/null || echo "")

if [ -n "$PHONE_NUMBER" ] && [ "$PHONE_NUMBER" != "None" ]; then
    echo "   Found: $PHONE_NUMBER"
    read -p "Claim this number? (y/n): " CLAIM_NUMBER
    
    if [ "$CLAIM_NUMBER" == "y" ]; then
        aws connect claim-phone-number \
            --target-arn "$INSTANCE_ARN" \
            --phone-number "$PHONE_NUMBER" \
            --region "$AWS_REGION"
        
        echo "✅ Phone number claimed!"
    fi
else
    echo "⚠️  No phone numbers available. Claim one manually in AWS Console."
    PHONE_NUMBER=""
fi

# Create contact flow
echo ""
echo "📋 Creating contact flow..."

FLOW_CONTENT='{
  "Version": "2019-10-30",
  "StartAction": "welcome",
  "Actions": [
    {
      "Identifier": "welcome",
      "Type": "MessageParticipant",
      "Parameters": {
        "Text": "Thank you for calling. Please hold while we connect you."
      },
      "Transitions": {
        "NextAction": "end"
      }
    },
    {
      "Identifier": "end",
      "Type": "DisconnectParticipant",
      "Parameters": {}
    }
  ]
}'

CONTACT_FLOW_ID=$(aws connect create-contact-flow \
    --instance-id "$INSTANCE_ID" \
    --name "CallMaker24-Default" \
    --type CONTACT_FLOW \
    --content "$FLOW_CONTENT" \
    --region "$AWS_REGION" \
    --query 'ContactFlowId' \
    --output text 2>/dev/null || echo "")

if [ -n "$CONTACT_FLOW_ID" ]; then
    echo "✅ Contact flow created: $CONTACT_FLOW_ID"
else
    echo "⚠️  Could not create contact flow"
    CONTACT_FLOW_ID=""
fi

# Update .env.local
echo ""
echo "💾 Updating .env.local..."

ENV_FILE=".env.local"

if [ -f "$ENV_FILE" ]; then
    # Update existing values
    sed -i.bak "s|^AWS_CONNECT_INSTANCE_ID=.*|AWS_CONNECT_INSTANCE_ID=$INSTANCE_ID|" "$ENV_FILE"
    sed -i.bak "s|^AWS_CONNECT_INSTANCE_ARN=.*|AWS_CONNECT_INSTANCE_ARN=$INSTANCE_ARN|" "$ENV_FILE"
    sed -i.bak "s|^AWS_CONNECT_INSTANCE_ALIAS=.*|AWS_CONNECT_INSTANCE_ALIAS=$INSTANCE_ALIAS|" "$ENV_FILE"
    
    if [ -n "$PHONE_NUMBER" ]; then
        sed -i.bak "s|^AWS_CONNECT_PHONE_NUMBER=.*|AWS_CONNECT_PHONE_NUMBER=$PHONE_NUMBER|" "$ENV_FILE"
    fi
    
    if [ -n "$CONTACT_FLOW_ID" ]; then
        sed -i.bak "s|^AWS_CONNECT_CONTACT_FLOW_ID=.*|AWS_CONNECT_CONTACT_FLOW_ID=$CONTACT_FLOW_ID|" "$ENV_FILE"
    fi
    
    rm -f "${ENV_FILE}.bak"
    echo "✅ .env.local updated"
else
    echo "⚠️  .env.local not found"
fi

# Print summary
echo ""
echo "============================================"
echo "✅ AWS Connect deployment complete!"
echo "============================================"
echo ""
echo "📊 Instance Details:"
echo "   Alias: $INSTANCE_ALIAS"
echo "   ID: $INSTANCE_ID"
echo "   ARN: $INSTANCE_ARN"
[ -n "$PHONE_NUMBER" ] && echo "   Phone: $PHONE_NUMBER"
[ -n "$CONTACT_FLOW_ID" ] && echo "   Contact Flow: $CONTACT_FLOW_ID"
echo ""
echo "🌐 CCP URL:"
echo "   https://${INSTANCE_ALIAS}.my.connect.aws/ccp-v2/"
echo ""
echo "📋 Next Steps:"
echo "   1. Test: node scripts/test-aws-connect.js"
echo "   2. Add environment variables to Vercel"
echo "   3. Configure additional contact flows in AWS Console"
echo ""
