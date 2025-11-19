/**
 * Mailgun Quick Setup & Test Script
 * Run with: node scripts/test-mailgun.js
 */

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('\n🚀 Mailgun Integration Setup & Test\n');
  console.log('This script will help you test your Mailgun configuration.\n');

  // Get credentials
  const apiKey = await question('Enter your Mailgun API Key: ');
  const domain = await question('Enter your Mailgun Domain: ');
  const region = await question('Enter your region (us/eu) [us]: ') || 'us';
  const testEmail = await question('Enter email address to send test to: ');

  console.log('\n📧 Testing Mailgun configuration...\n');

  try {
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: apiKey,
      url: region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
    });

    // Send test email
    const result = await mg.messages.create(domain, {
      from: `CallMaker24 Test <noreply@${domain}>`,
      to: [testEmail],
      subject: '✅ Mailgun Integration Test - Success!',
      text: 'If you receive this email, your Mailgun integration is working correctly!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px; }
            .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { background: white; padding: 30px; margin-top: 20px; border-radius: 8px; }
            .success { color: #10B981; font-size: 48px; text-align: center; }
            .info { background: #EEF2FF; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Mailgun Integration Test</h1>
            </div>
            <div class="content">
              <div class="success">✅</div>
              <h2 style="text-align: center; color: #10B981;">Success!</h2>
              <p style="text-align: center; font-size: 18px;">
                Your Mailgun integration is working correctly.
              </p>
              <div class="info">
                <strong>Configuration Details:</strong>
                <ul>
                  <li><strong>Domain:</strong> ${domain}</li>
                  <li><strong>Region:</strong> ${region.toUpperCase()}</li>
                  <li><strong>API:</strong> Connected ✅</li>
                  <li><strong>Status:</strong> Operational</li>
                </ul>
              </div>
              <p>
                You can now use Mailgun to send emails from your CallMaker24 platform.
                This test confirms that:
              </p>
              <ul>
                <li>✅ Your API key is valid</li>
                <li>✅ Your domain is configured correctly</li>
                <li>✅ Email delivery is working</li>
                <li>✅ HTML formatting is rendered properly</li>
              </ul>
              <h3>Next Steps:</h3>
              <ol>
                <li>Add these credentials to your <code>.env.local</code> file</li>
                <li>Set <code>EMAIL_PROVIDER=mailgun</code></li>
                <li>Configure webhooks for tracking (optional)</li>
                <li>Deploy to production</li>
              </ol>
            </div>
            <div class="footer">
              <p>Sent via Mailgun • CallMaker24 Platform</p>
              <p>This is a test email. No action required.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'o:tracking': 'yes',
      'o:tracking-opens': 'yes',
      'o:tracking-clicks': 'yes',
      'o:tag': ['test', 'setup']
    });

    console.log('✅ SUCCESS! Test email sent successfully.\n');
    console.log('📊 Email Details:');
    console.log(`   ID: ${result.id}`);
    console.log(`   Message: ${result.message}`);
    console.log(`   To: ${testEmail}\n`);
    
    console.log('📝 Next Steps:');
    console.log('   1. Check your inbox for the test email');
    console.log('   2. Add these credentials to your .env.local file:');
    console.log('');
    console.log('      EMAIL_PROVIDER=mailgun');
    console.log(`      MAILGUN_API_KEY=${apiKey}`);
    console.log(`      MAILGUN_DOMAIN=${domain}`);
    console.log(`      MAILGUN_REGION=${region}`);
    console.log(`      EMAIL_FROM=noreply@${domain}`);
    console.log('');
    console.log('   3. Restart your development server');
    console.log('   4. Test email sending in your application\n');

    // Test domain info
    console.log('📋 Fetching domain information...\n');
    
    try {
      const domainInfo = await mg.domains.get(domain);
      console.log('Domain Details:');
      console.log(`   Name: ${domainInfo.name}`);
      console.log(`   State: ${domainInfo.state}`);
      console.log(`   Type: ${domainInfo.type}`);
      console.log(`   Created: ${new Date(domainInfo.created_at).toLocaleDateString()}`);
      
      if (domainInfo.sending_dns_records) {
        console.log('\n📮 DNS Configuration Status:');
        domainInfo.sending_dns_records.forEach(record => {
          const status = record.valid === 'valid' ? '✅' : '⚠️';
          console.log(`   ${status} ${record.record_type}: ${record.valid}`);
        });
      }
    } catch (error) {
      console.log('   (Domain info not available for sandbox domains)');
    }

    console.log('\n✨ Mailgun setup complete!\n');

  } catch (error) {
    console.error('\n❌ ERROR: Failed to send test email\n');
    console.error('Details:', error.message);
    console.error('\nCommon issues:');
    console.error('   • Invalid API key');
    console.error('   • Incorrect domain name');
    console.error('   • Wrong region selected');
    console.error('   • Domain not verified (for custom domains)');
    console.error('   • Sandbox domain without authorized recipients\n');
    
    if (error.message.includes('sandbox')) {
      console.error('💡 TIP: Sandbox domains can only send to authorized recipients.');
      console.error('   Add authorized recipients in your Mailgun dashboard:');
      console.error('   Sending → Domain Settings → Authorized Recipients\n');
    }
  } finally {
    rl.close();
  }
}

main();
