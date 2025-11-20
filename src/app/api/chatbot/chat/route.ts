import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    return null
  }
  return new OpenAI({ apiKey })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, widgetId, customerId, customerEmail, customerPhone } = body

    let customerData = null
    let isVerified = false

    // Verify customer identity if ID or contact info provided
    if (customerId || customerEmail || customerPhone) {
      const whereClause: any = {}
      if (customerId) whereClause.id = customerId
      if (customerEmail) whereClause.email = customerEmail
      if (customerPhone) whereClause.phone = customerPhone

      customerData = await prisma.customer.findFirst({
        where: whereClause,
        include: {
          emailMessages: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          smsMessages: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          calls: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          organization: {
            select: {
              name: true
            }
          }
        }
      })

      if (customerData) {
        isVerified = true
      }
    }

    // Generate AI response based on customer context
    const openai = getOpenAIClient()
    let botResponse = "I'm here to help! Could you provide more details about your question?"
    
    const lowerMessage = message.toLowerCase()

    // Build context for AI
    let systemPrompt = `You are a helpful customer service assistant for ${customerData?.organization?.name || 'CallMaker24'}.

CallMaker24 is a SaaS platform that offers:
- Email & SMS marketing campaigns
- Call center tools with AI
- CRM & customer management
- Social media management
- AI-powered chatbots
- IVR systems

Pricing:
- Starter: $49.99/month
- Elite: $79.99/month
- Pro: $129.99/month
- Enterprise: $499.99/month

Be professional, helpful, and concise. If you don't know something, admit it politely.`

    let userContext = ''

    // Add customer-specific context if verified
    if (isVerified && customerData) {
      systemPrompt += `\n\nIMPORTANT: This customer is VERIFIED. You have access to their account information.`
      
      const name = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim()
      userContext = `\n\nCustomer Information:
- Name: ${name || 'Not provided'}
- Email: ${customerData.email || 'Not provided'}
- Phone: ${customerData.phone || 'Not provided'}
- Company: ${customerData.company || 'Not provided'}
- Email opt-in: ${customerData.emailOptIn ? 'Yes' : 'No'}
- SMS opt-in: ${customerData.smsOptIn ? 'Yes' : 'No'}
- Total emails received: ${customerData.emailMessages?.length || 0}
- Total SMS received: ${customerData.smsMessages?.length || 0}
- Total calls: ${customerData.calls?.length || 0}`

      if (customerData.emailMessages?.length > 0) {
        userContext += `\n- Last email: ${new Date(customerData.emailMessages[0].createdAt).toLocaleDateString()}`
      }
      if (customerData.calls?.length > 0) {
        userContext += `\n- Last call: ${new Date(customerData.calls[0].createdAt).toLocaleDateString()}`
      }
    } else if (lowerMessage.includes('my account') || lowerMessage.includes('my info') || lowerMessage.includes('my order')) {
      // Customer asking for personal info but not verified
      botResponse = `To access your account information, please verify your identity by providing:\n\n` +
        `• Your email address, OR\n` +
        `• Your phone number\n\n` +
        `For example: "My email is john@example.com"`
      
      return NextResponse.json({
        id: Date.now().toString(),
        response: botResponse,
        message: botResponse,
        timestamp: new Date().toISOString(),
        conversationId: conversationId || `conv_${Date.now()}`,
        widgetId: widgetId || null,
        isVerified: false,
        customerName: null
      })
    }

    // Handle unsubscribe requests directly (requires database update)
    if (isVerified && customerData && (lowerMessage === '1' || lowerMessage === '2' || lowerMessage === '3')) {
      const updates: any = {}
      if (lowerMessage === '1') {
        updates.emailOptIn = false
        botResponse = 'You have been unsubscribed from email communications.'
      } else if (lowerMessage === '2') {
        updates.smsOptIn = false
        botResponse = 'You have been unsubscribed from SMS communications.'
      } else if (lowerMessage === '3') {
        updates.emailOptIn = false
        updates.smsOptIn = false
        botResponse = 'You have been unsubscribed from all communications.'
      }
      
      await prisma.customer.update({
        where: { id: customerData.id },
        data: updates
      })
      
      return NextResponse.json({
        id: Date.now().toString(),
        response: botResponse,
        message: botResponse,
        timestamp: new Date().toISOString(),
        conversationId: conversationId || `conv_${Date.now()}`,
        widgetId: widgetId || null,
        isVerified: true,
        customerName: `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim()
      })
    }

    // Use OpenAI if available, otherwise fall back to rule-based
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt + userContext
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })

        botResponse = completion.choices[0]?.message?.content || botResponse
      } catch (error) {
        console.error('OpenAI API error:', error)
        // Fall through to rule-based response
      }
    } else {
      // Rule-based fallback responses
      if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
        botResponse = "Our pricing starts at $49.99/month for the Starter plan. We also offer Elite ($79.99/mo), Pro ($129.99/mo), and Enterprise ($499.99/mo) plans. Would you like to see all features?"
      } else if (lowerMessage.includes('feature') || lowerMessage.includes('what can')) {
        botResponse = "CallMaker24 offers:\n\n• Email & SMS campaigns\n• Call center tools with AI\n• CRM & customer management\n• Social media management\n• AI-powered chatbots\n• IVR systems\n\nWhich feature interests you?"
      } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
        botResponse = "I'm here to help! " + (isVerified ? "As a verified customer, I can help you with account info, order history, and more. " : "") + "What do you need assistance with?"
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        const greeting = isVerified && customerData ? `Hello ${customerData.firstName || 'there'}!` : 'Hello!'
        botResponse = `${greeting} How can I help you today?`
      } else if (lowerMessage.includes('thank')) {
        botResponse = "You're welcome! Is there anything else I can help you with?"
      } else if (isVerified && customerData && (lowerMessage.includes('my account') || lowerMessage.includes('my info'))) {
        const name = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim()
        botResponse = `Hello ${name}! Here's your account information:\n\n` +
          `📧 Email: ${customerData.email || 'Not provided'}\n` +
          `📱 Phone: ${customerData.phone || 'Not provided'}\n` +
          `🏢 Company: ${customerData.company || 'Not provided'}\n` +
          `✉️ Email opt-in: ${customerData.emailOptIn ? 'Yes' : 'No'}\n` +
          `📲 SMS opt-in: ${customerData.smsOptIn ? 'Yes' : 'No'}\n\n` +
          `How can I help you today?`
      } else if (isVerified && customerData && (lowerMessage.includes('my emails') || lowerMessage.includes('email history'))) {
        const emailCount = customerData.emailMessages?.length || 0
        botResponse = `You have received ${emailCount} emails from us. ` +
          (emailCount > 0 
            ? `The most recent was sent on ${new Date(customerData.emailMessages[0].createdAt).toLocaleDateString()}.`
            : 'We haven\'t sent you any emails yet.')
      } else if (isVerified && customerData && (lowerMessage.includes('my calls') || lowerMessage.includes('call history'))) {
        const callCount = customerData.calls?.length || 0
        botResponse = `You have ${callCount} call records with us. ` +
          (callCount > 0 
            ? `Your last call was on ${new Date(customerData.calls[0].createdAt).toLocaleDateString()}.`
            : 'We haven\'t had any calls yet.')
      } else if (isVerified && customerData && (lowerMessage.includes('unsubscribe') || lowerMessage.includes('opt out'))) {
        botResponse = `I can help you with that. Would you like to:\n\n` +
          `1. Unsubscribe from emails\n` +
          `2. Unsubscribe from SMS\n` +
          `3. Unsubscribe from both\n\n` +
          `Please reply with 1, 2, or 3.`
      }
    }

    // Save conversation to database
    if (customerData) {
      await prisma.chatConversation.create({
        data: {
          customerId: customerData.id,
          organizationId: customerData.organizationId,
          userId: null, // Bot response
          status: 'OPEN'
        }
      }).catch(() => {}) // Ignore if already exists
    }

    const responseData = {
      id: Date.now().toString(),
      response: botResponse,
      message: botResponse,
      timestamp: new Date().toISOString(),
      conversationId: conversationId || `conv_${Date.now()}`,
      widgetId: widgetId || null,
      isVerified,
      customerName: customerData ? `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() : null
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error processing chatbot message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    // In production, fetch from database
    const mockConversation = {
      id: conversationId || 'conv_1',
      messages: [
        {
          id: '1',
          text: 'Hello! How can I help you today?',
          sender: 'bot',
          timestamp: new Date().toISOString()
        }
      ]
    }

    return NextResponse.json(mockConversation)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
