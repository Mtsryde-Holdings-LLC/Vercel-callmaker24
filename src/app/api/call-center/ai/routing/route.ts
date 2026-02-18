import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'

/**
 * AI-powered intelligent call routing
 * Matches customers with the best-fit agent based on multiple factors
 */
export const POST = withApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const body = await request.json()
    const { customerId, callType, priority, skills, language = 'en' } = body

    // In production, use ML model to predict best agent match:
    /*
    const prediction = await mlModel.predict({
      customerHistory,
      callType,
      priority,
      requiredSkills: skills,
      language,
      availableAgents
    })
    
    return NextResponse.json({
      agentId: prediction.bestAgent.id,
      confidence: prediction.confidence,
      reasoning: prediction.reasoning
    })
    */

    // Mock AI routing logic
    const agents = [
      { 
        id: '1', 
        name: 'Sarah Johnson', 
        skills: ['sales', 'premium', 'enterprise'],
        languages: ['en'],
        performance: 94,
        currentLoad: 2,
        maxLoad: 5
      },
      { 
        id: '2', 
        name: 'Mike Chen', 
        skills: ['technical', 'support', 'billing'],
        languages: ['en', 'zh'],
        performance: 97,
        currentLoad: 3,
        maxLoad: 5
      },
      { 
        id: '3', 
        name: 'Emma Davis', 
        skills: ['sales', 'onboarding', 'training'],
        languages: ['en', 'es'],
        performance: 89,
        currentLoad: 1,
        maxLoad: 5
      },
      { 
        id: '4', 
        name: 'James Wilson', 
        skills: ['support', 'technical', 'escalation'],
        languages: ['en'],
        performance: 91,
        currentLoad: 4,
        maxLoad: 5
      },
      { 
        id: '5', 
        name: 'Lisa Anderson', 
        skills: ['billing', 'retention', 'cancellation'],
        languages: ['en'],
        performance: 93,
        currentLoad: 2,
        maxLoad: 5
      },
      { 
        id: '6', 
        name: 'David Martinez', 
        skills: ['sales', 'technical', 'demo'],
        languages: ['en', 'es'],
        performance: 96,
        currentLoad: 3,
        maxLoad: 5
      }
    ]

    // Calculate scores for each agent
    const scoredAgents = agents.map(agent => {
      let score = 0
      
      // Skill match (40% weight)
      if (skills && skills.length > 0) {
        const matchedSkills = skills.filter((s: string) => 
          agent.skills.includes(s.toLowerCase())
        ).length
        score += (matchedSkills / skills.length) * 40
      } else {
        score += 20 // Default if no specific skills required
      }
      
      // Language match (20% weight)
      if (agent.languages.includes(language)) {
        score += 20
      }
      
      // Performance score (25% weight)
      score += (agent.performance / 100) * 25
      
      // Load balancing (15% weight)
      const loadFactor = 1 - (agent.currentLoad / agent.maxLoad)
      score += loadFactor * 15

      return { ...agent, routingScore: Math.round(score) }
    })

    // Sort by score and get best match
    scoredAgents.sort((a, b) => b.routingScore - a.routingScore)
    const bestAgent = scoredAgents[0]
    const alternativeAgents = scoredAgents.slice(1, 3)

    const mockResponse = {
      recommendedAgent: {
        id: bestAgent.id,
        name: bestAgent.name,
        confidence: bestAgent.routingScore / 100,
        skills: bestAgent.skills,
        currentLoad: bestAgent.currentLoad,
        maxLoad: bestAgent.maxLoad
      },
      alternatives: alternativeAgents.map(a => ({
        id: a.id,
        name: a.name,
        confidence: a.routingScore / 100
      })),
      reasoning: [
        skills?.length > 0 ? `Matched ${skills.filter((s: string) => bestAgent.skills.includes(s.toLowerCase())).length}/${skills.length} required skills` : 'General routing',
        `Agent performance: ${bestAgent.performance}%`,
        `Current load: ${bestAgent.currentLoad}/${bestAgent.maxLoad} calls`,
        `Language: ${language}`
      ],
      estimatedWaitTime: Math.floor(bestAgent.currentLoad * 45), // seconds
      timestamp: new Date().toISOString()
    }

    return apiSuccess(mockResponse, { requestId })
  },
  { route: 'POST /api/call-center/ai/routing', rateLimit: RATE_LIMITS.standard }
)

/**
 * Get routing analytics
 */
export const GET = withApiHandler(
  async (_request: NextRequest, { requestId }: ApiContext) => {
    const analytics = {
      todayStats: {
        totalRouted: 147,
        aiRoutingAccuracy: 94,
        avgWaitTime: 38,
        customerSatisfaction: 4.7
      },
      routingBreakdown: {
        skills: 89,
        language: 12,
        priority: 28,
        random: 18
      },
      performanceImpact: {
        handleTimeReduction: -22,
        firstCallResolution: 12,
        transferRate: -35
      },
      timestamp: new Date().toISOString()
    }

    return apiSuccess(analytics, { requestId })
  },
  { route: 'GET /api/call-center/ai/routing', rateLimit: RATE_LIMITS.standard }
)
