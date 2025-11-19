/**
 * Quick Twilio Setup Check
 * Reads credentials from .env.local and tests the connection
 */

const fs = require('fs');
const path = require('path');

// Simple .env parser
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return env;
}

const env = loadEnv();
Object.assign(process.env, env);

async function quickTest() {
  console.log('\n🔧 TWILIO SETUP CHECK\n');
  console.log('='.repeat(50) + '\n');

  // Check environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  console.log('📋 Checking environment variables:\n');
  console.log(`  TWILIO_ACCOUNT_SID: ${accountSid ? '✅ Set' : '❌ Missing'}`);
  console.log(`  TWILIO_AUTH_TOKEN: ${authToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`  TWILIO_PHONE_NUMBER: ${phoneNumber ? '✅ Set (' + phoneNumber + ')' : '❌ Missing'}`);

  if (!accountSid || !authToken) {
    console.log('\n❌ Missing Twilio credentials in .env.local');
    console.log('\nPlease add these to your .env.local file:');
    console.log('  TWILIO_ACCOUNT_SID=your_account_sid');
    console.log('  TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('  TWILIO_PHONE_NUMBER=+1234567890');
    console.log('\nGet credentials from: https://console.twilio.com/\n');
    process.exit(1);
  }

  // Test Twilio connection
  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    console.log('\n🔄 Testing Twilio connection...\n');

    // Fetch account info
    const account = await client.api.accounts(accountSid).fetch();
    console.log('✅ Connection successful!');
    console.log(`   Account: ${account.friendlyName}`);
    console.log(`   Status: ${account.status}\n`);

    // List phone numbers
    console.log('📱 Your Twilio phone numbers:\n');
    const numbers = await client.incomingPhoneNumbers.list({ limit: 10 });
    
    if (numbers.length === 0) {
      console.log('   ⚠️  No phone numbers found. Buy one at:');
      console.log('   https://console.twilio.com/us1/develop/phone-numbers/manage/search\n');
    } else {
      numbers.forEach(num => {
        console.log(`   ${num.phoneNumber} - ${num.friendlyName || 'No name'}`);
        console.log(`     SMS: ${num.capabilities.sms ? '✅' : '❌'}`);
        console.log(`     Voice: ${num.capabilities.voice ? '✅' : '❌'}\n`);
      });
    }

    console.log('='.repeat(50));
    console.log('\n✅ Twilio is configured correctly!\n');
    console.log('Next steps:');
    console.log('  1. Configure webhooks in Twilio Console');
    console.log('  2. Set webhook URLs to:');
    console.log('     - SMS: https://yourdomain.com/api/webhooks/twilio/sms');
    console.log('     - Voice: https://yourdomain.com/api/webhooks/twilio/voice');
    console.log('  3. Test sending SMS: node scripts/send-test-sms.js');
    console.log('  4. Test making call: node scripts/make-test-call.js\n');

  } catch (error) {
    console.error('\n❌ Error testing Twilio:', error.message);
    
    if (error.code === 20003) {
      console.error('\n⚠️  Authentication failed. Check your credentials.');
    }
    
    process.exit(1);
  }
}

quickTest();
