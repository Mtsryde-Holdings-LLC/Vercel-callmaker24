#!/usr/bin/env node

/**
 * AWS Connect Setup Helper
 * 
 * This script helps you configure AWS Connect for your CallMaker24 platform
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 AWS Connect Setup Helper for CallMaker24\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📋 Creating .env file from .env.example...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created\n');
  } else {
    console.log('❌ .env.example not found. Please create it first.\n');
    process.exit(1);
  }
}

console.log('📖 AWS Connect Setup Instructions:\n');

console.log('1️⃣  Create AWS Connect Instance:');
console.log('   • Go to: https://console.aws.amazon.com/connect/');
console.log('   • Click "Add an instance"');
console.log('   • Choose "Store users within Amazon Connect"');
console.log('   • Create admin user');
console.log('   • Enable incoming and outgoing calls');
console.log('   • Accept default storage settings');
console.log('   • Create instance (takes 1-2 minutes)\n');

console.log('2️⃣  Get Instance Details:');
console.log('   • Instance Alias: (e.g., my-company)');
console.log('   • Instance ARN: (e.g., arn:aws:connect:us-east-1:123456789012:instance/abc-123)');
console.log('   • Instance ID: (last part of ARN: abc-123)\n');

console.log('3️⃣  Claim Phone Number:');
console.log('   • In your instance: Channels → Phone numbers');
console.log('   • Click "Claim a number"');
console.log('   • Choose country and select number');
console.log('   • Note the number in E.164 format (+18005551234)\n');

console.log('4️⃣  Create IAM User:');
console.log('   • Go to: https://console.aws.amazon.com/iam/');
console.log('   • Users → Add users');
console.log('   • Username: callmaker24-connect-api');
console.log('   • Access type: Programmatic access');
console.log('   • Attach policy: AmazonConnectFullAccess');
console.log('   • Save Access Key ID and Secret Access Key\n');

console.log('5️⃣  Update Environment Variables:');
console.log('   Edit your .env file with these values:');
console.log('   AWS_REGION=us-east-1');
console.log('   AWS_ACCESS_KEY_ID=AKIA...');
console.log('   AWS_SECRET_ACCESS_KEY=...');
console.log('   AWS_CONNECT_INSTANCE_ID=your-instance-id');
console.log('   AWS_CONNECT_INSTANCE_ARN=your-instance-arn');
console.log('   AWS_CONNECT_INSTANCE_ALIAS=your-instance-alias');
console.log('   AWS_CONNECT_PHONE_NUMBER=+18005551234\n');

console.log('6️⃣  Test Configuration:');
console.log('   Run: node scripts/test-aws-connect.js\n');

console.log('📚 For detailed setup guide, see: AWS-CONNECT-SETUP.md');
console.log('🎯 Need help? Check the documentation or create an issue.\n');

console.log('✨ Once configured, you can:');
console.log('   • Make outbound calls via API');
console.log('   • View real-time call center metrics');
console.log('   • Manage contact flows and queues');
console.log('   • Access call recordings');
console.log('   • Use the embedded agent interface (CCP)\n');