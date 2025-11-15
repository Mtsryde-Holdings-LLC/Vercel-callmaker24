import { NextRequest, NextResponse } from 'next/server'

/**
 * AI-powered response suggestions for agents
 * Provides context-aware recommendations during calls
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context, customerIntent, callId, agentId } = body

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required for suggestions' },
        { status: 400 }
      )
    }

    // In production, integrate with OpenAI, Claude, or custom AI model:
    /*
    const OpenAI = require('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant helping call center agents. Provide concise, helpful suggestions based on the conversation context."
        },
        {
          role: "user",
          content: `Context: ${context}\nCustomer Intent: ${customerIntent}\n\nProvide 3 helpful suggestions for the agent.`
        }
      ],
      max_tokens: 200
    })

    const suggestions = completion.choices[0].message.content.split('\n').filter(s => s.trim())
    
    return NextResponse.json({
      suggestions,
      callId,
      agentId,
      timestamp: new Date().toISOString()
    })
    */

    // Mock AI suggestions based on context
    const intentSuggestions: Record<string, any[]> = {
      pricing: [
        {
          id: 'sug_1',
          text: 'Offer 20% discount for annual subscription',
          type: 'discount',
          confidence: 0.92,
          icon: '💰'
        },
        {
          id: 'sug_2',
          text: 'Mention flexible payment plans available',
          type: 'payment',
          confidence: 0.88,
          icon: '💳'
        },
        {
          id: 'sug_3',
          text: 'Compare with competitor pricing ($149/mo)',
          type: 'comparison',
          confidence: 0.85,
          icon: '📊'
        }
      ],
      features: [
        {
          id: 'sug_4',
          text: 'Highlight advanced analytics dashboard',
          type: 'feature',
          confidence: 0.95,
          icon: '📈'
        },
        {
          id: 'sug_5',
          text: 'Schedule live demo for next week',
          type: 'demo',
          confidence: 0.90,
          icon: '🎯'
        },
        {
          id: 'sug_6',
          text: 'Send product comparison sheet via email',
          type: 'resource',
          confidence: 0.87,
          icon: '📧'
        }
      ],
      support: [
        {
          id: 'sug_7',
          text: 'Check knowledge base article #247',
          type: 'resource',
          confidence: 0.93,
          icon: '📚'
        },
        {
          id: 'sug_8',
          text: 'Escalate to technical specialist',
          type: 'escalation',
          confidence: 0.78,
          icon: '🚀'
        },
        {
          id: 'sug_9',
          text: 'Offer remote assistance session',
          type: 'support',
          confidence: 0.85,
          icon: '🖥️'
        }
      ],
      complaint: [
        {
          id: 'sug_10',
          text: 'Apologize and show empathy first',
          type: 'empathy',
          confidence: 0.97,
          icon: '💙'
        },
        {
          id: 'sug_11',
          text: 'Offer immediate credit of $50',
          type: 'compensation',
          confidence: 0.82,
          icon: '💵'
        },
        {
          id: 'sug_12',
          text: 'Schedule follow-up call in 24 hours',
          type: 'followup',
          confidence: 0.89,
          icon: '📞'
        }
      ],
      general: [
        {
          id: 'sug_13',
          text: 'Ask qualifying questions about needs',
          type: 'discovery',
          confidence: 0.80,
          icon: '❓'
        },
        {
          id: 'sug_14',
          text: 'Mention current promotion (15% off)',
          type: 'promotion',
          confidence: 0.85,
          icon: '🎁'
        },
        {
          id: 'sug_15',
          text: 'Offer free trial for 14 days',
          type: 'trial',
          confidence: 0.88,
          icon: '🆓'
        }
      ]
    }

    const intent = customerIntent?.toLowerCase() || 'general'
    const suggestions = intentSuggestions[intent] || intentSuggestions.general

    const mockResponse = {
      suggestions,
      context,
      customerIntent: intent,
      callId,
      agentId,
      timestamp: new Date().toISOString(),
      nextBestActions: [
        'Send follow-up email with discussed materials',
        'Add customer to nurture campaign',
        'Schedule callback if interested'
      ]
    }

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

/**
 * Log suggestion usage for training
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { suggestionId, accepted, callId, agentId } = body

    // In production, log to database for AI model training
    const mockResponse = {
      success: true,
      suggestionId,
      accepted,
      callId,
      agentId,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('Error logging suggestion usage:', error)
    return NextResponse.json(
      { error: 'Failed to log suggestion usage' },
      { status: 500 }
    )
  }
}
