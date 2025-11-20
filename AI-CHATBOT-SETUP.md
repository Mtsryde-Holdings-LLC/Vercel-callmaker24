# AI Chatbot Setup Guide

## Overview
Your CallMaker24 chatbot now uses **OpenAI GPT-4o-mini** for intelligent, natural conversations with proper multi-tenant isolation.

## Features ✨

### 🔒 Multi-Tenant Isolation
- Each organization gets isolated context
- Customer data never leaks between tenants
- Organization-specific branding in responses

### 🔐 Customer Verification
- Verify customers by email or phone
- Access to account information only after verification
- Personalized responses with customer history

### 🤖 AI-Powered Responses
- Natural language understanding
- Context-aware conversations
- Professional customer service tone
- Automatic fallback to rule-based responses if API unavailable

### 📊 Customer Context
When verified, AI has access to:
- Customer name, email, phone, company
- Email opt-in/opt-out status
- SMS opt-in/opt-out status
- Email history (count & last email date)
- SMS history (count)
- Call history (count & last call date)

## Setup Instructions

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Give it a name (e.g., "CallMaker24 Production")
5. Copy the key (starts with `sk-proj-...` or `sk-...`)

### 2. Add to Local Environment

Edit `.env.local` and replace:
```env
OPENAI_API_KEY=your-openai-api-key-here
```

With your actual key:
```env
OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE
```

### 3. Add to Vercel Production

1. Go to https://vercel.com/dashboard
2. Select your CallMaker24 project
3. Go to Settings → Environment Variables
4. Add new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key
   - **Environments**: Production, Preview, Development
5. Click "Save"
6. Redeploy your application

### 4. Test the Chatbot

#### Without Verification (General Questions)
```
User: "What are your prices?"
AI: Provides pricing information for all plans

User: "What features do you offer?"
AI: Lists CallMaker24 features naturally

User: "How can I unsubscribe?"
AI: Asks customer to verify identity first
```

#### With Verification (Personal Questions)
```
User: "My email is john@example.com"
AI: [Verifies customer in database]

User: "Show me my account info"
AI: Provides personalized account details

User: "When was my last email?"
AI: Retrieves from database and responds naturally

User: "I want to unsubscribe from emails"
AI: Provides unsubscribe options and updates database
```

## Technical Details

### Model: GPT-4o-mini
- **Why**: Newest, fastest, most cost-effective for customer service
- **Speed**: ~0.5-1s response time
- **Cost**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Quality**: Excellent for customer service conversations

### API Configuration
```typescript
{
  model: 'gpt-4o-mini',
  temperature: 0.7,      // Balanced creativity
  max_tokens: 500        // Concise responses
}
```

### Security Features
1. **API Key Validation**: Checks for valid key before making calls
2. **Graceful Fallback**: Uses rule-based responses if API fails
3. **Tenant Isolation**: Each request includes only relevant organization data
4. **No Data Leakage**: Customer context built per-request, not stored

### System Prompt Structure
```
Base: Professional customer service assistant identity
Organization: Dynamic per tenant
Features: CallMaker24 capabilities
Pricing: All plan tiers
Customer Context: Only if verified (name, email, history)
```

## Cost Estimation

### Average Conversation
- **Input**: ~500 tokens (system prompt + customer context + message)
- **Output**: ~150 tokens (response)
- **Cost per message**: ~$0.00015 (0.015 cents)

### Monthly Projections
| Conversations/Month | Cost |
|---------------------|------|
| 1,000 | $0.15 |
| 10,000 | $1.50 |
| 100,000 | $15.00 |
| 1,000,000 | $150.00 |

### Cost per Tenant
With proper multi-tenant architecture, you can:
- Track usage per organization
- Pass costs through to customers
- Set usage limits per plan tier

## Monitoring & Optimization

### Check API Usage
1. Go to https://platform.openai.com/usage
2. Monitor token consumption
3. Set up billing alerts

### Optimize Costs
- Reduce `max_tokens` for shorter responses
- Cache common responses
- Use rule-based for simple queries (already implemented)

### Monitor Performance
```typescript
// Add to your chatbot API
console.log('OpenAI response time:', responseTime, 'ms')
console.log('Tokens used:', completion.usage)
```

## Troubleshooting

### "OpenAI API error" in Console
- Check API key is valid
- Verify key has credits/active billing
- Check rate limits on OpenAI dashboard

### Chatbot Not Using AI
- Verify `OPENAI_API_KEY` is set (not "your-openai-api-key-here")
- Check environment variables loaded (restart dev server)
- Look for API errors in console

### Rate Limit Errors
- OpenAI free tier: 3 RPM (requests per minute)
- Paid tier: 3,500+ RPM
- Implement request queuing if needed

## Next Steps

1. ✅ Add OpenAI API key
2. ✅ Test with verified customers
3. 🔄 Monitor usage and costs
4. 🔄 Adjust system prompt per organization
5. 🔄 Add conversation history storage
6. 🔄 Implement user satisfaction ratings

## Support

### OpenAI Resources
- API Docs: https://platform.openai.com/docs
- Community: https://community.openai.com
- Status: https://status.openai.com

### CallMaker24 Chatbot
- Code: `src/app/api/chatbot/chat/route.ts`
- Customer verification logic preserved
- Multi-tenant isolation implemented
- Graceful fallback to rules included
