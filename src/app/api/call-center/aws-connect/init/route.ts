import { NextRequest, NextResponse } from 'next/server'
import { awsConnectService } from '@/lib/aws-connect.service'

/**
 * Initialize AWS Connect Contact Control Panel (CCP)
 * 
 * Returns CCP configuration for embedding in the frontend
 */
export async function POST(request: NextRequest) {
  try {
    const config = awsConnectService.getConfig()

    if (!config.isConfigured) {
      return NextResponse.json(
        {
          error: 'AWS Connect not configured',
          message: 'Please set AWS_CONNECT_INSTANCE_ID, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY',
          status: 'disconnected'
        },
        { status: 400 }
      )
    }

    // Verify connection by getting instance details
    try {
      const instance = await awsConnectService.getInstance()
      
      return NextResponse.json({
        status: 'connected',
        ccpUrl: config.ccpUrl,
        instanceId: config.instanceId,
        instanceArn: instance?.Arn || config.instanceArn,
        region: config.region,
        softphoneEnabled: true,
        instanceAlias: instance?.InstanceAlias,
        message: 'Successfully connected to AWS Connect'
      })
    } catch (verifyError) {
      console.error('AWS Connect verification failed:', verifyError)
      
      // Return partial config even if verification fails
      return NextResponse.json({
        status: 'configured',
        ccpUrl: config.ccpUrl,
        instanceId: config.instanceId,
        region: config.region,
        message: 'AWS Connect configured but verification failed',
        warning: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      })
    }
  } catch (error) {
    console.error('Error initializing AWS Connect:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initialize AWS Connect', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    )
  }
}
