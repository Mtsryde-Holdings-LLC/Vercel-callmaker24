/**
 * AWS Connect Automated Deployment Script
 * 
 * This script automates the creation and configuration of AWS Connect instance
 * Run with: node scripts/deploy-aws-connect.js
 * 
 * Prerequisites:
 * - AWS CLI configured with credentials
 * - Node.js 18+
 * - Proper IAM permissions
 */

const { 
  ConnectClient,
  CreateInstanceCommand,
  DescribeInstanceCommand,
  ListPhoneNumbersV2Command,
  SearchAvailablePhoneNumbersCommand,
  ClaimPhoneNumberCommand,
  CreateContactFlowCommand,
  CreateQueueCommand,
  CreateRoutingProfileCommand,
  AssociateInstanceStorageConfigCommand,
  UpdateInstanceAttributeCommand
} = require('@aws-sdk/client-connect')

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

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

function updateEnvFile(updates) {
  const envPath = path.join(__dirname, '..', '.env.local')
  let envContent = fs.readFileSync(envPath, 'utf8')
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`)
    } else {
      envContent += `\n${key}=${value}`
    }
  }
  
  fs.writeFileSync(envPath, envContent)
  console.log('✅ Updated .env.local')
}

async function deployAWSConnect() {
  console.log('\n🚀 AWS Connect Automated Deployment\n')
  console.log('='.repeat(70))
  
  loadEnv()
  
  // Check for AWS credentials
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const region = process.env.AWS_REGION || 'us-east-1'
  
  if (!accessKeyId || !secretAccessKey || 
      accessKeyId.includes('your-') || secretAccessKey.includes('your-')) {
    console.log('\n❌ AWS credentials not configured\n')
    console.log('Please set up AWS credentials first:')
    console.log('1. Go to: https://console.aws.amazon.com/iam/')
    console.log('2. Create user with AdministratorAccess or AmazonConnectFullAccess')
    console.log('3. Save Access Key ID and Secret Access Key')
    console.log('4. Update .env.local:\n')
    console.log('   AWS_REGION=us-east-1')
    console.log('   AWS_ACCESS_KEY_ID=AKIA...')
    console.log('   AWS_SECRET_ACCESS_KEY=...\n')
    process.exit(1)
  }
  
  const client = new ConnectClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  })
  
  console.log('\n✅ AWS credentials configured')
  console.log(`📍 Region: ${region}\n`)
  
  // Check if instance already exists
  const existingInstanceId = process.env.AWS_CONNECT_INSTANCE_ID
  if (existingInstanceId && !existingInstanceId.includes('your-')) {
    console.log('ℹ️  Instance ID found in .env.local')
    const useExisting = await question('Use existing instance? (y/n): ')
    
    if (useExisting.toLowerCase() === 'y') {
      try {
        const describeCmd = new DescribeInstanceCommand({
          InstanceId: existingInstanceId
        })
        const instance = await client.send(describeCmd)
        console.log(`\n✅ Using existing instance: ${instance.Instance.InstanceAlias}`)
        await configureExistingInstance(client, instance.Instance)
        return
      } catch (error) {
        console.log('❌ Instance not found. Creating new one...')
      }
    }
  }
  
  console.log('\n📋 Creating new AWS Connect instance...\n')
  
  // Get instance details
  const instanceAlias = await question('Enter instance alias (e.g., my-company-connect): ')
  const displayName = await question('Enter display name (e.g., My Company Call Center): ')
  
  console.log('\n⏳ Creating instance (this takes 2-3 minutes)...')
  
  try {
    // Create instance
    const createCmd = new CreateInstanceCommand({
      IdentityManagementType: 'CONNECT_MANAGED',
      InstanceAlias: instanceAlias,
      InboundCallsEnabled: true,
      OutboundCallsEnabled: true,
      ClientToken: `deploy_${Date.now()}`
    })
    
    const createResult = await client.send(createCmd)
    const instanceId = createResult.Id
    const instanceArn = createResult.Arn
    
    console.log('✅ Instance created!')
    console.log(`   Instance ID: ${instanceId}`)
    console.log(`   Instance ARN: ${instanceArn}`)
    
    // Wait for instance to be active
    console.log('\n⏳ Waiting for instance to become active...')
    await waitForInstanceActive(client, instanceId)
    
    // Get full instance details
    const describeCmd = new DescribeInstanceCommand({ InstanceId: instanceId })
    const instance = await client.send(describeCmd)
    
    // Configure the instance
    await configureNewInstance(client, instance.Instance)
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message)
    if (error.name === 'ResourceConflictException') {
      console.log('\n⚠️  Instance alias already exists. Try a different name.')
    }
    process.exit(1)
  }
}

async function waitForInstanceActive(client, instanceId, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const cmd = new DescribeInstanceCommand({ InstanceId: instanceId })
      const result = await client.send(cmd)
      
      if (result.Instance?.InstanceStatus === 'ACTIVE') {
        console.log('✅ Instance is active!')
        return
      }
      
      process.stdout.write('.')
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (error) {
      // Continue waiting
    }
  }
  throw new Error('Instance took too long to become active')
}

async function configureNewInstance(client, instance) {
  console.log('\n📞 Configuring phone number...')
  
  try {
    // Search for available phone numbers
    const searchCmd = new SearchAvailablePhoneNumbersCommand({
      TargetArn: instance.Arn,
      PhoneNumberCountryCode: 'US',
      PhoneNumberType: 'DID',
      MaxResults: 5
    })
    
    const searchResult = await client.send(searchCmd)
    
    if (!searchResult.AvailableNumbersList?.length) {
      console.log('⚠️  No phone numbers available. Please claim one manually.')
    } else {
      const phoneNumber = searchResult.AvailableNumbersList[0].PhoneNumber
      console.log(`\n📱 Found available number: ${phoneNumber}`)
      
      const claimNumber = await question('Claim this number? (y/n): ')
      
      if (claimNumber.toLowerCase() === 'y') {
        const claimCmd = new ClaimPhoneNumberCommand({
          TargetArn: instance.Arn,
          PhoneNumber: phoneNumber
        })
        
        await client.send(claimCmd)
        console.log('✅ Phone number claimed!')
        
        // Update env with phone number
        updateEnvFile({
          AWS_CONNECT_PHONE_NUMBER: phoneNumber
        })
      }
    }
  } catch (error) {
    console.log('⚠️  Could not claim phone number:', error.message)
    console.log('   Please claim manually in AWS Console')
  }
  
  // Create basic contact flow
  console.log('\n📋 Creating contact flow...')
  await createDefaultContactFlow(client, instance.Id)
  
  // Create queue
  console.log('\n📊 Creating queue...')
  await createDefaultQueue(client, instance.Id, instance.Arn)
  
  // Update environment variables
  console.log('\n💾 Updating .env.local...')
  updateEnvFile({
    AWS_CONNECT_INSTANCE_ID: instance.Id,
    AWS_CONNECT_INSTANCE_ARN: instance.Arn,
    AWS_CONNECT_INSTANCE_ALIAS: instance.InstanceAlias
  })
  
  console.log('\n✅ AWS Connect deployment complete!')
  console.log('\n📊 Instance Details:')
  console.log(`   Alias: ${instance.InstanceAlias}`)
  console.log(`   ID: ${instance.Id}`)
  console.log(`   CCP URL: https://${instance.InstanceAlias}.my.connect.aws/ccp-v2/`)
  console.log(`   Console: https://console.aws.amazon.com/connect/`)
}

async function configureExistingInstance(client, instance) {
  console.log('\n📋 Configuring existing instance...')
  
  // List phone numbers
  try {
    const phoneCmd = new ListPhoneNumbersV2Command({
      TargetArn: instance.Arn,
      MaxResults: 10
    })
    
    const phoneResult = await client.send(phoneCmd)
    
    if (phoneResult.ListPhoneNumbersSummaryList?.length) {
      console.log('\n📱 Phone numbers:')
      phoneResult.ListPhoneNumbersSummaryList.forEach((phone, idx) => {
        console.log(`   ${idx + 1}. ${phone.PhoneNumber} (${phone.PhoneNumberType})`)
      })
      
      const firstPhone = phoneResult.ListPhoneNumbersSummaryList[0].PhoneNumber
      updateEnvFile({ AWS_CONNECT_PHONE_NUMBER: firstPhone })
    }
  } catch (error) {
    console.log('⚠️  Could not list phone numbers')
  }
  
  // Ensure env is updated
  updateEnvFile({
    AWS_CONNECT_INSTANCE_ID: instance.Id,
    AWS_CONNECT_INSTANCE_ARN: instance.Arn,
    AWS_CONNECT_INSTANCE_ALIAS: instance.InstanceAlias
  })
  
  console.log('\n✅ Configuration updated!')
  console.log(`   CCP URL: https://${instance.InstanceAlias}.my.connect.aws/ccp-v2/`)
}

async function createDefaultContactFlow(client, instanceId) {
  const flowContent = {
    Version: '2019-10-30',
    StartAction: 'welcome',
    Actions: [
      {
        Identifier: 'welcome',
        Type: 'MessageParticipant',
        Parameters: {
          Text: 'Thank you for calling. Please hold while we connect you to an agent.'
        },
        Transitions: {
          NextAction: 'transfer',
          Errors: [],
          Conditions: []
        }
      },
      {
        Identifier: 'transfer',
        Type: 'TransferToQueue',
        Parameters: {
          QueueId: 'BasicQueue'
        },
        Transitions: {
          NextAction: 'end',
          Errors: [{ NextAction: 'end' }],
          Conditions: []
        }
      },
      {
        Identifier: 'end',
        Type: 'DisconnectParticipant',
        Parameters: {},
        Transitions: {}
      }
    ]
  }
  
  try {
    const cmd = new CreateContactFlowCommand({
      InstanceId: instanceId,
      Name: 'CallMaker24-Default-Flow',
      Type: 'CONTACT_FLOW',
      Content: JSON.stringify(flowContent),
      Description: 'Default contact flow for CallMaker24'
    })
    
    const result = await client.send(cmd)
    console.log(`✅ Contact flow created: ${result.ContactFlowId}`)
    
    updateEnvFile({
      AWS_CONNECT_CONTACT_FLOW_ID: result.ContactFlowId
    })
  } catch (error) {
    console.log('⚠️  Could not create contact flow:', error.message)
  }
}

async function createDefaultQueue(client, instanceId, instanceArn) {
  try {
    const cmd = new CreateQueueCommand({
      InstanceId: instanceId,
      Name: 'CallMaker24-Queue',
      Description: 'Default queue for CallMaker24 calls',
      HoursOfOperationId: 'BasicHours',
      MaxContacts: 50,
      OutboundCallerConfig: {
        OutboundCallerIdName: 'CallMaker24',
        OutboundFlowId: 'Default'
      }
    })
    
    const result = await client.send(cmd)
    console.log(`✅ Queue created: ${result.QueueId}`)
    
    updateEnvFile({
      AWS_CONNECT_QUEUE_ID: result.QueueId
    })
  } catch (error) {
    console.log('⚠️  Could not create queue:', error.message)
  }
}

// Run deployment
deployAWSConnect()
  .then(() => {
    console.log('\n🎉 Deployment complete!')
    console.log('\nNext steps:')
    console.log('1. Test configuration: node scripts/test-aws-connect.js')
    console.log('2. Add environment variables to Vercel')
    console.log('3. Deploy application')
    rl.close()
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Deployment failed:', error)
    rl.close()
    process.exit(1)
  })
