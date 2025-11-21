import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        tags: true,
        _count: {
          select: {
            emailMessages: true,
            smsMessages: true,
            calls: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(req, { params })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    const body = await req.json()

    // Verify customer belongs to user's organization
    const existing = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: body,
      include: {
        tags: true,
      },
    })

    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    // Verify customer belongs to user's organization before deletion
    const existing = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    await prisma.customer.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Customer deleted' })
  } catch (error) {
    console.error('Delete customer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
