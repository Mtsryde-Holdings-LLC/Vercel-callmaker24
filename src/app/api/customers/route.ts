import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const customerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  emailOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
})

// GET /api/customers - List all customers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('GET customers error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = customerSchema.parse(body)

    // Check if customer already exists in this organization
    if (validatedData.email) {
      const existing = await prisma.customer.findFirst({
        where: {
          email: validatedData.email,
          organizationId: session.user.organizationId,
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        )
      }
    }

    const customer = await prisma.customer.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
        organizationId: session.user.organizationId,
      },
      include: {
        tags: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: customer,
    })
  } catch (error: any) {
    console.error('POST customer error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
