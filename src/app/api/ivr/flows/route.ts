import { NextRequest, NextResponse } from 'next/server'

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
    // const flows = await prisma.ivrMenu.findMany({
    //   where: { organizationId: user.organizationId },
    //   orderBy: { createdAt: 'desc' }
    // })

    // Mock response (for now)
    const mockFlows = [
      {
        id: '1',
        name: 'Main Reception',
        description: 'Primary customer intake flow',
        nodes: [
          {
            id: 'welcome',
            type: 'message',
            label: 'Welcome Message',
            prompt: 'Thank you for calling CallMaker24.'
          },
          {
            id: 'main-menu',
            type: 'menu',
            label: 'Main Menu',
            prompt: 'Press 1 for Sales, Press 2 for Support, Press 0 for Operator',
            options: [
              { key: '1', action: 'Forward to Sales' },
              { key: '2', action: 'Forward to Support' },
              { key: '0', action: 'Forward to Operator' }
            ]
          }
        ],
        status: 'active',
        callsHandled: 1247,
        organizationId: user.organizationId
      }
    ]

    return NextResponse.json(mockFlows)
  } catch (error) {
    console.error('Error fetching IVR flows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch IVR flows' },
      { status: 500 }
    )
  }
}

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
    
    // In production, validate and save to database with organizationId
    // const newFlow = await prisma.ivrMenu.create({
    //   data: {
    //     ...body,
    //     organizationId: user.organizationId,
    //     status: 'draft'
    //   }
    // })

    // Mock response (for now)
    const newFlow = {
      id: Date.now().toString(),
      ...body,
      status: 'draft',
      callsHandled: 0,
      organizationId: user.organizationId,
      createdAt: new Date().toISOString()
    }
    
    return NextResponse.json(newFlow, { status: 201 })
  } catch (error) {
    console.error('Error creating IVR flow:', error)
    return NextResponse.json(
      { error: 'Failed to create IVR flow' },
      { status: 500 }
    )
  }
}
