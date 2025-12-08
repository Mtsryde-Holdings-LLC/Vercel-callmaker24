import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


export const dynamic = 'force-dynamic'
// GET /api/call-center/agents - Get agents for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    // Fetch all agents (users with AGENT or SUB_ADMIN role) from the organization
    const agents = await prisma.user.findMany({
      where: {
        organizationId: session.user.organizationId,
        role: {
          in: ['AGENT', 'SUB_ADMIN', 'ADMIN']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get call statistics for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        // Get today's calls for this agent
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const todayCalls = await prisma.call.count({
          where: {
            organizationId: session.user.organizationId,
            agentId: agent.id,
            createdAt: {
              gte: startOfDay
            }
          }
        })

        // Get average call duration
        const avgDuration = await prisma.call.aggregate({
          where: {
            organizationId: session.user.organizationId,
            agentId: agent.id,
            status: 'completed',
            duration: {
              not: null
            }
          },
          _avg: {
            duration: true
          }
        })

        // Check if agent has active call
        const activeCall = await prisma.call.findFirst({
          where: {
            organizationId: session.user.organizationId,
            agentId: agent.id,
            status: 'active'
          },
          select: {
            id: true,
            phoneNumber: true
          }
        })

        // Determine agent status
        let status: 'Available' | 'On Call' | 'Break' | 'Offline' = 'Offline'
        
        if (activeCall) {
          status = 'On Call'
        } else if (agent.lastLoginAt) {
          const lastLogin = new Date(agent.lastLoginAt)
          const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
          if (lastLogin > fifteenMinutesAgo) {
            status = 'Available'
          }
        }

        const avgSeconds = avgDuration._avg.duration || 0
        const avgMinutes = Math.floor(avgSeconds / 60)
        const avgSecondsRemainder = Math.floor(avgSeconds % 60)

        return {
          id: agent.id,
          name: agent.name || agent.email,
          email: agent.email,
          role: agent.role,
          status,
          currentCall: activeCall?.phoneNumber,
          callsToday: todayCalls,
          avgHandleTime: `${avgMinutes}:${avgSecondsRemainder.toString().padStart(2, '0')}`
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: agentsWithStats
    })
  } catch (error: any) {
    console.error('GET agents error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
