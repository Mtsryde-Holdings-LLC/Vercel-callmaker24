import { NextRequest, NextResponse } from 'next/server'
import { awsConnectService } from '@/lib/aws-connect.service'
import { getServerSession } from 'next-auth'

/**
 * Get AWS Connect real-time metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!awsConnectService.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'AWS Connect not configured',
          metrics: {}
        },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queueId = searchParams.get('queueId') || undefined

    const metrics = await awsConnectService.getCurrentMetrics(queueId)

    // Parse metrics into a more usable format
    const parsedMetrics: Record<string, any> = {}
    
    metrics.forEach(result => {
      result.Collections?.forEach(collection => {
        const metricName = collection.Metric?.Name
        const value = collection.Value
        if (metricName && value !== undefined) {
          parsedMetrics[metricName] = value
        }
      })
    })

    return NextResponse.json({
      metrics: {
        agentsOnline: parsedMetrics.AGENTS_ONLINE || 0,
        agentsAvailable: parsedMetrics.AGENTS_AVAILABLE || 0,
        agentsOnCall: parsedMetrics.AGENTS_ON_CALL || 0,
        contactsInQueue: parsedMetrics.CONTACTS_IN_QUEUE || 0,
        oldestContactAge: parsedMetrics.OLDEST_CONTACT_AGE || 0
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting metrics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
