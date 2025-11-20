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

    // Fetch real calls from database
    const calls = await prisma.call.findMany({
      where: { organizationId: user.organizationId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true
          }
        },
        assignedTo: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Transform for frontend
    const transformedCalls = calls.map(call => ({
      id: call.id,
      phoneNumber: call.to,
      customerName: call.customer 
        ? `${call.customer.firstName || ''} ${call.customer.lastName || ''}`.trim() 
        : 'Unknown',
      startTime: call.startedAt?.toISOString() || call.createdAt.toISOString(),
      duration: call.duration || 0,
      status: call.status?.toLowerCase() || 'completed',
      agent: call.assignedTo?.name || 'Unknown',
      disposition: call.metadata?.disposition || 'N/A'
    }))

    return NextResponse.json(transformedCalls)
  } catch (error) {
    console.error('Error fetching calls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    )
  }
}
