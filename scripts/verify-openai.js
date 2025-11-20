/**
 * Quick OpenAI API Key Verification
 */

const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');

// Load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

async function verifyOpenAI() {
  console.log('\n🔍 Verifying OpenAI Configuration...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your-openai-api-key-here' || apiKey === 'placeholder') {
    console.log('❌ OpenAI API key not configured');
    console.log('📝 Add your key to .env.local');
    return;
  }
  
  console.log(`✅ API Key found: ${apiKey.substring(0, 20)}...${apiKey.slice(-4)}`);
  console.log('🎯 Model: gpt-4o-mini');
  console.log('\n🧪 Testing API connection...\n');
  
  try {
    const openai = new OpenAI({ apiKey });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond in one short sentence.'
        },
        {
          role: 'user',
          content: 'Say "Hello from CallMaker24!"'
        }
      ],
      max_tokens: 50
    });
    
    const response = completion.choices[0].message.content;
    
    console.log('✅ SUCCESS! OpenAI API is working!\n');
    console.log('📤 Test Request: "Say Hello from CallMaker24!"');
    console.log(`📥 AI Response: "${response}"\n`);
    console.log('📊 Usage:');
    console.log(`   - Prompt tokens: ${completion.usage.prompt_tokens}`);
    console.log(`   - Completion tokens: ${completion.usage.completion_tokens}`);
    console.log(`   - Total tokens: ${completion.usage.total_tokens}`);
    console.log(`   - Cost: ~$${((completion.usage.prompt_tokens * 0.15 + completion.usage.completion_tokens * 0.60) / 1000000).toFixed(6)}`);
    
    console.log('\n✨ Your AI chatbot is ready!\n');
    console.log('Next steps:');
    console.log('1. Add this key to Vercel environment variables');
    console.log('2. Redeploy your application');
    console.log('3. Test the chatbot on your website\n');
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    if (error.status === 401) {
      console.log('\n⚠️  Invalid API key. Please check:');
      console.log('   - Key is correct and complete');
      console.log('   - Account has billing enabled');
      console.log('   - Get a new key from: https://platform.openai.com/api-keys\n');
    } else if (error.status === 429) {
      console.log('\n⚠️  Rate limit reached. This means:');
      console.log('   - ✅ API key is valid!');
      console.log('   - ⚠️  Too many requests. Wait a moment and try again.\n');
    } else {
      console.log('\n⚠️  Error details:', error);
    }
  }
}

verifyOpenAI().catch(console.error);
