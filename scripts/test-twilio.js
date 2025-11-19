/**
 * Twilio Configuration Test Script
 * 
 * Tests both SMS and Voice functionality
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Check if twilio is installed
let twilio;
try {
  twilio = require('twilio');
} catch (error) {
  console.error('❌ Twilio package not found. Installing...');
  require('child_process').execSync('npm install twilio', { stdio: 'inherit' });
  twilio = require('twilio');
}

async function testTwilio() {
  console.log('\n🔧 TWILIO CONFIGURATION TEST\n');
  console.log('='.repeat(50) + '\n');

  // Get credentials
  const accountSid = await ask('Enter your Twilio Account SID: ');
  const authToken = await ask('Enter your Twilio Auth Token: ');
  const phoneNumber = await ask('Enter your Twilio Phone Number (e.g., +15551234567): ');

  console.log('\n📋 Configuration Summary:\n');
  console.log(`  Account SID: ${accountSid.substring(0, 10)}...`);
  console.log(`  Auth Token: ${authToken.substring(0, 8)}...`);
  console.log(`  Phone Number: ${phoneNumber}\n`);

  const confirm = await ask('Is this correct? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Configuration cancelled.');
    rl.close();
    process.exit(0);
  }

  const client = twilio(accountSid, authToken);

  // Test 1: Verify Account
  console.log('\n🔍 Test 1: Verifying Twilio Account...');
  try {
    const account = await client.api.accounts(accountSid).fetch();
    console.log('✅ Account verified!');
    console.log(`   Friendly Name: ${account.friendlyName}`);
    console.log(`   Status: ${account.status}`);
    console.log(`   Type: ${account.type}\n`);
  } catch (error) {
    console.error('❌ Account verification failed:', error.message);
    rl.close();
    process.exit(1);
  }

  // Test 2: Check Phone Number Capabilities
  console.log('🔍 Test 2: Checking Phone Number Capabilities...');
  try {
    const numbers = await client.incomingPhoneNumbers.list();
    const myNumber = numbers.find(n => n.phoneNumber === phoneNumber);
    
    if (myNumber) {
      console.log('✅ Phone number found!');
      console.log(`   Friendly Name: ${myNumber.friendlyName}`);
      console.log(`   Capabilities:`);
      console.log(`     Voice: ${myNumber.capabilities.voice ? '✅' : '❌'}`);
      console.log(`     SMS: ${myNumber.capabilities.sms ? '✅' : '❌'}`);
      console.log(`     MMS: ${myNumber.capabilities.mms ? '✅' : '❌'}\n`);
      
      if (!myNumber.capabilities.voice && !myNumber.capabilities.sms) {
        console.log('⚠️  Warning: Number has no Voice or SMS capabilities!');
      }
    } else {
      console.log('⚠️  Phone number not found in your account.');
      console.log('   Available numbers:');
      numbers.forEach(n => {
        console.log(`     - ${n.phoneNumber} (${n.friendlyName})`);
      });
      console.log('');
    }
  } catch (error) {
    console.error('❌ Phone number check failed:', error.message);
  }

  // Test 3: Send Test SMS
  const testSms = await ask('Would you like to send a test SMS? (yes/no): ');
  if (testSms.toLowerCase() === 'yes') {
    const testTo = await ask('Enter recipient phone number (e.g., +15551234567): ');
    
    console.log('\n📱 Test 3: Sending Test SMS...');
    try {
      const message = await client.messages.create({
        body: 'Test message from CallMaker24! Your Twilio SMS is configured correctly. 🎉',
        from: phoneNumber,
        to: testTo
      });

      console.log('✅ SMS sent successfully!');
      console.log(`   Message SID: ${message.sid}`);
      console.log(`   Status: ${message.status}`);
      console.log(`   To: ${message.to}`);
      console.log(`   From: ${message.from}\n`);
    } catch (error) {
      console.error('❌ SMS send failed:', error.message);
      if (error.code === 21211) {
        console.log('   Tip: The recipient number may not be verified on trial account.');
      }
      console.log('');
    }
  }

  // Test 4: Make Test Call
  const testCall = await ask('Would you like to make a test call? (yes/no): ');
  if (testCall.toLowerCase() === 'yes') {
    const testCallTo = await ask('Enter recipient phone number (e.g., +15551234567): ');
    
    console.log('\n📞 Test 4: Making Test Call...');
    try {
      const call = await client.calls.create({
        twiml: '<Response><Say voice="alice">Hello! This is a test call from CallMaker24. Your Twilio voice configuration is working correctly. Goodbye!</Say></Response>',
        to: testCallTo,
        from: phoneNumber
      });

      console.log('✅ Call initiated successfully!');
      console.log(`   Call SID: ${call.sid}`);
      console.log(`   Status: ${call.status}`);
      console.log(`   To: ${call.to}`);
      console.log(`   From: ${call.from}`);
      console.log('   The recipient should receive a call momentarily.\n');
    } catch (error) {
      console.error('❌ Call failed:', error.message);
      if (error.code === 21211) {
        console.log('   Tip: The recipient number may not be verified on trial account.');
      }
      console.log('');
    }
  }

  // Test 5: Check Balance (if production account)
  console.log('💰 Test 5: Checking Account Balance...');
  try {
    const balance = await client.balance.fetch();
    console.log(`✅ Balance: ${balance.currency} ${balance.balance}`);
    
    if (parseFloat(balance.balance) < 5) {
      console.log('⚠️  Warning: Low balance. Consider adding more credits.\n');
    } else {
      console.log('');
    }
  } catch (error) {
    console.log('ℹ️  Balance check not available (trial account)\n');
  }

  // Generate .env configuration
  console.log('='.repeat(50));
  console.log('\n📝 Add these to your .env.local file:\n');
  console.log('# Twilio Configuration');
  console.log(`TWILIO_ACCOUNT_SID=${accountSid}`);
  console.log(`TWILIO_AUTH_TOKEN=${authToken}`);
  console.log(`TWILIO_PHONE_NUMBER=${phoneNumber}`);
  console.log('');

  // Save to file option
  const saveEnv = await ask('Would you like to save these to .env.local? (yes/no): ');
  if (saveEnv.toLowerCase() === 'yes') {
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    try {
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
    } catch (error) {
      // File doesn't exist, that's okay
    }

    // Update or add Twilio variables
    const twilioVars = {
      'TWILIO_ACCOUNT_SID': accountSid,
      'TWILIO_AUTH_TOKEN': authToken,
      'TWILIO_PHONE_NUMBER': phoneNumber
    };

    Object.entries(twilioVars).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*`, 'gm');
      const line = `${key}=${value}`;
      
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, line);
      } else {
        envContent += `\n${line}`;
      }
    });

    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('✅ Configuration saved to .env.local\n');
  }

  console.log('='.repeat(50));
  console.log('\n✅ Twilio configuration test complete!\n');
  console.log('📚 Next Steps:');
  console.log('   1. Configure webhooks in Twilio Console');
  console.log('   2. Set up Voice URL: https://yourdomain.com/api/voice/ivr');
  console.log('   3. Set up SMS URL: https://yourdomain.com/api/sms/webhook');
  console.log('   4. Test end-to-end with your application\n');
  console.log('📖 Full guide: See TWILIO_SETUP_GUIDE.md\n');

  rl.close();
}

testTwilio()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    rl.close();
    process.exit(1);
  });
