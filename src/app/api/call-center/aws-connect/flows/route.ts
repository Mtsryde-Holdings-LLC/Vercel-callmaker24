import { NextRequest, NextResponse } from 'next/server'
import { awsConnectService } from '@/lib/aws-connect.service'
import { getServerSession } from 'next-auth'


export const dynamic = 'force-dynamic'
/**
 * Get AWS Connect Contact Flows (IVR Flows)
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
          flows: []
        },
        { status: 400 }
      )
    }

    const flows = await awsConnectService.listContactFlows()

    return NextResponse.json({
      flows: flows.map(flow => ({
        id: flow.Id,
        arn: flow.Arn,
        name: flow.Name,
        type: flow.ContactFlowType,
        description: flow.Description || ''
      }))
    })
  } catch (error) {
    console.error('Error listing contact flows:', error)
    return NextResponse.json(
      { 
        error: 'Failed to list contact flows',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
