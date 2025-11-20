import { NextRequest, NextResponse } from 'next/server'
import { awsConnectService } from '@/lib/aws-connect.service'
import { getServerSession } from 'next-auth'

/**
 * Get AWS Connect Queues
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
          queues: []
        },
        { status: 400 }
      )
    }

    const queues = await awsConnectService.listQueues()

    return NextResponse.json({
      queues: queues.map(queue => ({
        id: queue.Id,
        arn: queue.Arn,
        name: queue.Name,
        type: queue.QueueType,
        description: queue.Description || ''
      }))
    })
  } catch (error) {
    console.error('Error listing queues:', error)
    return NextResponse.json(
      { 
        error: 'Failed to list queues',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
