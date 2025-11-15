import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, widgetId } = body

    // In production, integrate with OpenAI or custom AI model
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4-turbo-preview",
    //   messages: [
    //     { role: "system", content: "You are a helpful customer support assistant for CallMaker24." },
    //     { role: "user", content: message }
    //   ]
    // })

    // Mock AI response
    let botResponse = "I'm here to help! Could you provide more details about your question?"
    
    // Simple intent matching (in production, use proper NLP)
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      botResponse = "Our pricing starts at $29/month for the basic plan. Would you like to see all our pricing options?"
    } else if (lowerMessage.includes('feature') || lowerMessage.includes('what can')) {
      botResponse = "CallMaker24 offers email campaigns, SMS marketing, call center tools, IVR systems, and AI-powered chatbots. Which feature interests you?"
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      botResponse = "I'm here to help! Can you describe the issue you're experiencing, and I'll do my best to assist you?"
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      botResponse = "Hello! How can I help you today?"
    } else if (lowerMessage.includes('thank')) {
      botResponse = "You're welcome! Is there anything else I can help you with?"
    }

    const responseData = {
      id: Date.now().toString(),
      response: botResponse, // Changed from 'message' to 'response' for widget compatibility
      message: botResponse,
      timestamp: new Date().toISOString(),
      conversationId: conversationId || `conv_${Date.now()}`,
      widgetId: widgetId || null
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
