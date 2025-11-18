import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true }
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Forbidden - No organization' }, { status: 403 })
    }

    const body = await request.json()
    const { phoneNumber, action } = body

    // In production, integrate with Twilio or similar service
    // const client = twilio(accountSid, authToken)
    // const call = await client.calls.create({
    //   to: phoneNumber,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   url: 'http://your-app.com/voice'
    // })

    // Mock response
    const callData = {
      id: `call_${Date.now()}`,
      phoneNumber,
      status: action === 'start' ? 'initiated' : 'ended',
      startTime: new Date().toISOString(),
      duration: 0,
      organizationId: user.organizationId
    }

    return NextResponse.json(callData)
  } catch (error) {
    console.error('Error managing call:', error)
    return NextResponse.json(
      { error: 'Failed to manage call' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true }
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Forbidden - No organization' }, { status: 403 })
    }

    // In production, fetch from database filtered by organizationId
    // const calls = await prisma.call.findMany({
    //   where: { organizationId: user.organizationId },
    //   orderBy: { createdAt: 'desc' }
    // })

    // Mock response (for now)
    const mockCalls = [
      {
        id: 'call_1',
        phoneNumber: '+1 (555) 123-4567',
        name: 'John Doe',
        duration: 323,
        status: 'completed',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        organizationId: user.organizationId
      },
      {
        id: 'call_2',
        phoneNumber: '+1 (555) 234-5678',
        name: 'Jane Smith',
        duration: 225,
        status: 'completed',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        organizationId: user.organizationId
      }
    ]

    return NextResponse.json(mockCalls)
  } catch (error) {
    console.error('Error fetching calls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    )
  }
}
