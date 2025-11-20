/**
 * AWS Connect Configuration Test
 * 
 * Tests AWS Connect integration and displays setup instructions
 * Run with: node scripts/test-aws-connect.js
 */

const fs = require('fs')
const path = require('path')

// Load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnv()

async function testAWSConnect() {
  console.log('\n📞 AWS Connect Configuration Test\n')
  console.log('='.repeat(70))

  // Check required environment variables
  const requiredVars = {
    'AWS_REGION': process.env.AWS_REGION,
    'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID,
    'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY,
    'AWS_CONNECT_INSTANCE_ID': process.env.AWS_CONNECT_INSTANCE_ID,
    'AWS_CONNECT_INSTANCE_ARN': process.env.AWS_CONNECT_INSTANCE_ARN,
    'AWS_CONNECT_INSTANCE_ALIAS': process.env.AWS_CONNECT_INSTANCE_ALIAS,
    'AWS_CONNECT_CONTACT_FLOW_ID': process.env.AWS_CONNECT_CONTACT_FLOW_ID,
    'AWS_CONNECT_PHONE_NUMBER': process.env.AWS_CONNECT_PHONE_NUMBER
  }

  console.log('\n1️⃣  Environment Variables:')
  let allConfigured = true
  
  for (const [key, value] of Object.entries(requiredVars)) {
    const isPlaceholder = !value || 
                          value.includes('your-') || 
                          value === 'us-east-1' ||
                          value.includes('123456789012')
    
    if (isPlaceholder) {
      console.log(`   ❌ ${key}: NOT SET`)
      allConfigured = false
    } else {
      // Mask sensitive values
      let displayValue = value
      if (key.includes('SECRET') || key.includes('KEY')) {
        displayValue = value.substring(0, 8) + '...' + value.slice(-4)
      }
      console.log(`   ✅ ${key}: ${displayValue}`)
    }
  }

  if (!allConfigured) {
    console.log('\n2️⃣  Setup Instructions:\n')
    console.log('📋 To configure AWS Connect, follow these steps:\n')
    
    console.log('Step 1: Create AWS Connect Instance')
    console.log('   • Go to: https://console.aws.amazon.com/connect/')
    console.log('   • Click "Add an instance"')
    console.log('   • Choose identity management (Amazon Connect)')
    console.log('   • Set access URL (this becomes your instance alias)')
    console.log('   • Complete wizard\n')
    
    console.log('Step 2: Get Instance Details')
    console.log('   • Open your instance')
    console.log('   • Copy Instance ARN (arn:aws:connect:region:account:instance/id)')
    console.log('   • Extract Instance ID (last part of ARN)')
    console.log('   • Note your Instance Alias (from URL)\n')
    
    console.log('Step 3: Create Contact Flow (IVR)')
    console.log('   • In instance, go to "Routing" → "Contact flows"')
    console.log('   • Create a new flow or use default')
    console.log('   • Publish and copy the Contact Flow ID\n')
    
    console.log('Step 4: Claim Phone Number')
    console.log('   • Go to "Channels" → "Phone numbers"')
    console.log('   • Claim a phone number')
    console.log('   • Copy the phone number (E.164 format: +1234567890)\n')
    
    console.log('Step 5: Create IAM User for API Access')
    console.log('   • Go to: https://console.aws.amazon.com/iam/')
    console.log('   • Create new user with programmatic access')
    console.log('   • Attach policy: AmazonConnectFullAccess')
    console.log('   • Save Access Key ID and Secret Access Key\n')
    
    console.log('Step 6: Create Queue (Optional)')
    console.log('   • In instance, go to "Routing" → "Queues"')
    console.log('   • Create or use "BasicQueue"')
    console.log('   • Copy Queue ID\n')
    
    console.log('Step 7: Update .env.local')
    console.log('   Edit .env.local and add:\n')
    console.log('   AWS_REGION=us-east-1')
    console.log('   AWS_ACCESS_KEY_ID=AKIA...')
    console.log('   AWS_SECRET_ACCESS_KEY=...')
    console.log('   AWS_CONNECT_INSTANCE_ID=12345678-1234-1234-1234-123456789012')
    console.log('   AWS_CONNECT_INSTANCE_ARN=arn:aws:connect:us-east-1:...')
    console.log('   AWS_CONNECT_INSTANCE_ALIAS=my-company')
    console.log('   AWS_CONNECT_CONTACT_FLOW_ID=12345678-1234-1234-1234-123456789012')
    console.log('   AWS_CONNECT_QUEUE_ID=12345678-1234-1234-1234-123456789012')
    console.log('   AWS_CONNECT_PHONE_NUMBER=+18005551234\n')
    
  } else {
    console.log('\n✅ All environment variables configured!\n')
    
    console.log('2️⃣  Testing AWS SDK Connection...\n')
    
    try {
      const { ConnectClient, DescribeInstanceCommand } = require('@aws-sdk/client-connect')
      
      const client = new ConnectClient({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      })
      
      const command = new DescribeInstanceCommand({
        InstanceId: process.env.AWS_CONNECT_INSTANCE_ID
      })
      
      const response = await client.send(command)
      
      console.log('✅ AWS Connect Connection Successful!\n')
      console.log('📊 Instance Details:')
      console.log(`   • Instance Alias: ${response.Instance?.InstanceAlias}`)
      console.log(`   • Instance ARN: ${response.Instance?.Arn}`)
      console.log(`   • Service Role: ${response.Instance?.ServiceRole}`)
      console.log(`   • Status: ${response.Instance?.InstanceStatus}`)
      console.log(`   • Created: ${response.Instance?.CreatedTime}`)
      console.log(`   • Inbound Calls: ${response.Instance?.InboundCallsEnabled ? 'Enabled' : 'Disabled'}`)
      console.log(`   • Outbound Calls: ${response.Instance?.OutboundCallsEnabled ? 'Enabled' : 'Disabled'}`)
      
      console.log('\n3️⃣  CCP URL (for embedding):')
      console.log(`   https://${response.Instance?.InstanceAlias}.my.connect.aws/ccp-v2/`)
      
    } catch (error) {
      console.log('❌ Connection Failed!\n')
      console.log('Error:', error.message)
      
      if (error.name === 'ResourceNotFoundException') {
        console.log('\n⚠️  Instance not found. Check AWS_CONNECT_INSTANCE_ID')
      } else if (error.name === 'UnrecognizedClientException') {
        console.log('\n⚠️  Invalid credentials. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
      } else if (error.name === 'AccessDeniedException') {
        console.log('\n⚠️  Access denied. Ensure IAM user has AmazonConnectFullAccess policy')
      }
    }
  }

  console.log('\n4️⃣  Features Available:')
  console.log('   ✅ Outbound calling via API')
  console.log('   ✅ Contact flow management')
  console.log('   ✅ Real-time metrics')
  console.log('   ✅ Call recording')
  console.log('   ✅ Queue management')
  console.log('   ✅ Agent status tracking')
  console.log('   ✅ Multi-tenant isolation')

  console.log('\n5️⃣  API Endpoints:')
  console.log('   POST /api/call-center/aws-connect/init')
  console.log('   POST /api/call-center/aws-connect/make-call')
  console.log('   GET  /api/call-center/aws-connect/flows')
  console.log('   GET  /api/call-center/aws-connect/queues')
  console.log('   GET  /api/call-center/aws-connect/metrics')

  console.log('\n6️⃣  Cost Estimation:')
  console.log('   💰 Usage-based pricing:')
  console.log('   • $0.018 per minute for usage')
  console.log('   • $0.0025 per minute for chat')
  console.log('   • Phone numbers: ~$0.03/day')
  console.log('   • No upfront costs\n')

  console.log('\n7️⃣  Next Steps:')
  if (allConfigured) {
    console.log('   1. ✅ Configuration complete')
    console.log('   2. Add environment variables to Vercel')
    console.log('   3. Deploy and test on production')
    console.log('   4. Configure contact flows in AWS Console')
  } else {
    console.log('   1. Complete AWS Connect setup (see instructions above)')
    console.log('   2. Update .env.local with real values')
    console.log('   3. Run this script again to test')
    console.log('   4. Add to Vercel environment variables')
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n📚 Documentation:')
  console.log('   AWS Connect: https://docs.aws.amazon.com/connect/')
  console.log('   API Reference: https://docs.aws.amazon.com/connect/latest/APIReference/')
  console.log('   CCP Integration: https://github.com/amazon-connect/amazon-connect-streams\n')
}

testAWSConnect().catch(console.error)
