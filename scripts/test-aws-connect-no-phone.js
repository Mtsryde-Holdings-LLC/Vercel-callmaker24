#!/usr/bin/env node

/**
 * Test AWS Connect without phone number
 * Tests basic connectivity and instance access
 */

require('dotenv').config();
const { AWSConnectService } = require('../src/lib/aws-connect.service.ts');

async function testAWSConnect() {
  console.log('🧪 Testing AWS Connect (No Phone Number Required)...\n');

  const connectService = new AWSConnectService();

  // Test 1: Check configuration
  console.log('1️⃣ Checking configuration...');
  const config = connectService.getConfig();
  console.log(`   Region: ${config.region}`);
  console.log(`   Configured: ${config.isConfigured ? '✅' : '❌'}`);
  
  if (!config.isConfigured) {
    console.log('❌ AWS Connect not configured. Please set environment variables.');
    return;
  }

  try {
    // Test 2: Get instance details
    console.log('\n2️⃣ Testing instance access...');
    const instance = await connectService.getInstance();
    console.log(`   ✅ Instance: ${instance.InstanceAlias}`);
    console.log(`   Status: ${instance.InstanceStatus}`);
    console.log(`   Inbound: ${instance.InboundCallsEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Outbound: ${instance.OutboundCallsEnabled ? 'Enabled' : 'Disabled'}`);

    // Test 3: List contact flows
    console.log('\n3️⃣ Listing contact flows...');
    const flows = await connectService.listContactFlows();
    console.log(`   ✅ Found ${flows.length} contact flows`);
    flows.slice(0, 3).forEach(flow => {
      console.log(`   • ${flow.Name} (${flow.ContactFlowType})`);
    });

    // Test 4: List queues
    console.log('\n4️⃣ Listing queues...');
    const queues = await connectService.listQueues();
    console.log(`   ✅ Found ${queues.length} queues`);
    queues.slice(0, 3).forEach(queue => {
      console.log(`   • ${queue.Name}`);
    });

    console.log('\n✅ AWS Connect is properly configured!');
    console.log('📞 Once you get a phone number, you can make calls.');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    
    if (error.message.includes('AccessDenied')) {
      console.log('💡 Check your AWS credentials and IAM permissions');
    } else if (error.message.includes('ResourceNotFound')) {
      console.log('💡 Check your AWS_CONNECT_INSTANCE_ID');
    }
  }
}

testAWSConnect();