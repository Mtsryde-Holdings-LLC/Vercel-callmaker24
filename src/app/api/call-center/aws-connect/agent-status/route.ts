import { NextRequest, NextResponse } from 'next/server'

/**
 * Update agent status in AWS Connect
 * 
 * Possible statuses:
 * - Available (ready to take calls)
 * - Offline (not available)
 * - After Call Work (ACW)
 * - Break
 * - Lunch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { status, agentId } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // In production, update agent status via AWS Connect:
    /*
    const AWS = require('aws-sdk')
    const connect = new AWS.Connect({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })

    const statusArn = getStatusArn(status) // Map friendly name to ARN

    const params = {
      AgentStatusId: statusArn,
      InstanceId: process.env.AWS_CONNECT_INSTANCE_ID,
      UserId: agentId
    }

    await connect.putUserStatus(params).promise()

    return NextResponse.json({
      success: true,
      status,
      agentId,
      timestamp: new Date().toISOString()
    })
    */

    // Mock response for development
    const result = {
      success: true,
      agentId: agentId || 'agent_mock',
      status: status,
      timestamp: new Date().toISOString(),
      previousStatus: 'Offline',
      statusArn: `arn:aws:connect:us-east-1:123456789012:instance/instance-id/agent-state/${status.toLowerCase()}`
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating agent status:', error)
    return NextResponse.json(
      { error: 'Failed to update agent status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    // In production, fetch current agent status from AWS Connect
    /*
    const AWS = require('aws-sdk')
    const connect = new AWS.Connect({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })

    const params = {
      InstanceId: process.env.AWS_CONNECT_INSTANCE_ID,
      UserId: agentId
    }

    const response = await connect.describeUser(params).promise()
    
    return NextResponse.json({
      agentId,
      status: response.User.RoutingProfileId,
      available: response.User.DirectoryUserId ? true : false
    })
    */

    // Mock response
    return NextResponse.json({
      agentId: agentId || 'agent_mock',
      status: 'Available',
      available: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching agent status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent status' },
      { status: 500 }
    )
  }
}
