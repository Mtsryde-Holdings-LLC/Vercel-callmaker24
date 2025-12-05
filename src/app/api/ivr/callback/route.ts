import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    const callback = await prisma.callback.create({
      data: {
        customerPhone: body.phone,
        customerName: body.name,
        department: body.department,
        scheduledFor: new Date(body.scheduledFor),
        notes: body.notes,
        organizationId: session.user.organizationId!
      }
    })

    return NextResponse.json({ success: true, data: callback })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to schedule callback' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callbacks = await prisma.callback.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { scheduledFor: 'asc' }
    })

    return NextResponse.json({ success: true, data: callbacks })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch callbacks' }, { status: 500 })
  }
}
