#!/usr/bin/env node

/**
 * AWS Connect Infrastructure as Code
 * 
 * Terraform-style configuration for AWS Connect
 * Run with: node scripts/aws-connect-iac.js
 */

const { 
  ConnectClient,
  CreateInstanceCommand,
  UpdateInstanceAttributeCommand,
  CreateContactFlowCommand,
  CreateQueueCommand,
  CreateRoutingProfileCommand,
  CreateUserCommand,
  CreateSecurityProfileCommand,
  AssociateRoutingProfileQueuesCommand
} = require('@aws-sdk/client-connect')

const fs = require('fs')
const path = require('path')

// Infrastructure configuration
const config = {
  region: 'us-east-1',
  instance: {
    alias: 'callmaker24-prod',
    displayName: 'CallMaker24 Production',
    inboundCallsEnabled: true,
    outboundCallsEnabled: true,
    identityManagement: 'CONNECT_MANAGED'
  },
  contactFlows: [
    {
      name: 'Main-Reception',
      type: 'CONTACT_FLOW',
      description: 'Main reception flow with IVR',
      content: {
        version: '2019-10-30',
        startAction: 'greeting',
        actions: [
          {
            identifier: 'greeting',
            type: 'MessageParticipant',
            parameters: {
              text: 'Thank you for calling. Press 1 for Sales, Press 2 for Support, or stay on the line for an operator.'
            },
            transitions: {
              nextAction: 'getInput'
            }
          },
          {
            identifier: 'getInput',
            type: 'GetParticipantInput',
            parameters: {
              timeout: 5,
              maxDigits: 1
            },
            transitions: {
              nextAction: 'checkInput',
              conditions: [
                { value: '1', nextAction: 'transferSales' },
                { value: '2', nextAction: 'transferSupport' }
              ]
            }
          },
          {
            identifier: 'transferSales',
            type: 'TransferToQueue',
            parameters: { queueId: 'SalesQueue' },
            transitions: { nextAction: 'end' }
          },
          {
            identifier: 'transferSupport',
            type: 'TransferToQueue',
            parameters: { queueId: 'SupportQueue' },
            transitions: { nextAction: 'end' }
          },
          {
            identifier: 'end',
            type: 'DisconnectParticipant'
          }
        ]
      }
    },
    {
      name: 'Outbound-Campaign',
      type: 'CONTACT_FLOW',
      description: 'Outbound calling campaign flow',
      content: {
        version: '2019-10-30',
        startAction: 'introduction',
        actions: [
          {
            identifier: 'introduction',
            type: 'MessageParticipant',
            parameters: {
              text: 'Hello, this is an automated call from CallMaker24. Please hold while we connect you to an agent.'
            },
            transitions: { nextAction: 'transfer' }
          },
          {
            identifier: 'transfer',
            type: 'TransferToQueue',
            parameters: { queueId: 'OutboundQueue' },
            transitions: { nextAction: 'end' }
          },
          {
            identifier: 'end',
            type: 'DisconnectParticipant'
          }
        ]
      }
    }
  ],
  queues: [
    {
      name: 'Sales-Queue',
      description: 'Sales inquiries and new customer acquisition',
      maxContacts: 25,
      outboundCallerIdName: 'CallMaker24 Sales'
    },
    {
      name: 'Support-Queue',
      description: 'Customer support and technical assistance',
      maxContacts: 50,
      outboundCallerIdName: 'CallMaker24 Support'
    },
    {
      name: 'Outbound-Queue',
      description: 'Outbound calling campaigns',
      maxContacts: 100,
      outboundCallerIdName: 'CallMaker24'
    }
  ],
  routingProfiles: [
    {
      name: 'Sales-Agent-Profile',
      description: 'Routing profile for sales agents',
      defaultOutboundQueueId: 'SalesQueue',
      queues: ['SalesQueue', 'OutboundQueue']
    },
    {
      name: 'Support-Agent-Profile',
      description: 'Routing profile for support agents',
      defaultOutboundQueueId: 'SupportQueue',
      queues: ['SupportQueue']
    }
  ]
}

async function deployInfrastructure() {
  console.log('\n🏗️  AWS Connect Infrastructure Deployment\n')
  console.log('='.repeat(70))
  
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  
  if (!accessKeyId || !secretAccessKey) {
    console.error('\n❌ AWS credentials not found')
    console.log('Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment')
    process.exit(1)
  }
  
  const client = new ConnectClient({
    region: config.region,
    credentials: { accessKeyId, secretAccessKey }
  })
  
  console.log(`\n📍 Region: ${config.region}`)
  console.log(`📦 Instance: ${config.instance.alias}`)
  
  const instanceId = process.env.AWS_CONNECT_INSTANCE_ID
  
  if (!instanceId || instanceId.includes('your-')) {
    console.log('\n❌ Instance ID not configured')
    console.log('Run: node scripts/deploy-aws-connect.js first')
    process.exit(1)
  }
  
  console.log(`✅ Using instance: ${instanceId}\n`)
  
  // Deploy contact flows
  console.log('📋 Deploying contact flows...')
  const flowIds = {}
  
  for (const flow of config.contactFlows) {
    try {
      const cmd = new CreateContactFlowCommand({
        InstanceId: instanceId,
        Name: flow.name,
        Type: flow.type,
        Description: flow.description,
        Content: JSON.stringify(flow.content)
      })
      
      const result = await client.send(cmd)
      flowIds[flow.name] = result.ContactFlowId
      console.log(`   ✅ ${flow.name}: ${result.ContactFlowId}`)
    } catch (error) {
      if (error.name === 'DuplicateResourceException') {
        console.log(`   ⚠️  ${flow.name} already exists`)
      } else {
        console.log(`   ❌ ${flow.name}: ${error.message}`)
      }
    }
  }
  
  // Deploy queues
  console.log('\n📊 Deploying queues...')
  const queueIds = {}
  
  for (const queue of config.queues) {
    try {
      const cmd = new CreateQueueCommand({
        InstanceId: instanceId,
        Name: queue.name,
        Description: queue.description,
        HoursOfOperationId: 'BasicHours', // Use default hours
        MaxContacts: queue.maxContacts,
        OutboundCallerConfig: {
          OutboundCallerIdName: queue.outboundCallerIdName
        }
      })
      
      const result = await client.send(cmd)
      queueIds[queue.name] = result.QueueId
      console.log(`   ✅ ${queue.name}: ${result.QueueId}`)
    } catch (error) {
      if (error.name === 'DuplicateResourceException') {
        console.log(`   ⚠️  ${queue.name} already exists`)
      } else {
        console.log(`   ❌ ${queue.name}: ${error.message}`)
      }
    }
  }
  
  // Deploy routing profiles
  console.log('\n🔀 Deploying routing profiles...')
  
  for (const profile of config.routingProfiles) {
    try {
      const cmd = new CreateRoutingProfileCommand({
        InstanceId: instanceId,
        Name: profile.name,
        Description: profile.description,
        DefaultOutboundQueueId: queueIds[profile.defaultOutboundQueueId],
        MediaConcurrencies: [
          {
            Channel: 'VOICE',
            Concurrency: 1
          }
        ],
        QueueConfigs: profile.queues.map(queueName => ({
          QueueReference: {
            QueueId: queueIds[queueName],
            Channel: 'VOICE'
          },
          Priority: 1,
          Delay: 0
        }))
      })
      
      const result = await client.send(cmd)
      console.log(`   ✅ ${profile.name}: ${result.RoutingProfileId}`)
    } catch (error) {
      if (error.name === 'DuplicateResourceException') {
        console.log(`   ⚠️  ${profile.name} already exists`)
      } else {
        console.log(`   ❌ ${profile.name}: ${error.message}`)
      }
    }
  }
  
  // Save configuration
  console.log('\n💾 Saving configuration...')
  const outputConfig = {
    instanceId,
    region: config.region,
    flows: flowIds,
    queues: queueIds,
    deployedAt: new Date().toISOString()
  }
  
  fs.writeFileSync(
    path.join(__dirname, 'aws-connect-config.json'),
    JSON.stringify(outputConfig, null, 2)
  )
  
  console.log('   ✅ Configuration saved to scripts/aws-connect-config.json')
  
  console.log('\n✅ Infrastructure deployment complete!')
  console.log('\n📊 Summary:')
  console.log(`   Contact Flows: ${Object.keys(flowIds).length}`)
  console.log(`   Queues: ${Object.keys(queueIds).length}`)
  console.log(`   Routing Profiles: ${config.routingProfiles.length}`)
}

if (require.main === module) {
  deployInfrastructure()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Deployment failed:', error)
      process.exit(1)
    })
}

module.exports = { deployInfrastructure, config }
