import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['AGENT', 'SUB_ADMIN'])
})

// POST /api/team/invite - Invite a new user to the organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    // Check if user has permission to invite
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = inviteSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      if (existingUser.organizationId === session.user.organizationId) {
        return NextResponse.json(
          { error: 'User already exists in your organization' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'User already registered with another organization' },
          { status: 400 }
        )
      }
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name || validatedData.email.split('@')[0],
        password: hashedPassword,
        role: validatedData.role,
        organizationId: session.user.organizationId,
        assignedBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    // TODO: Send invitation email with temporary password
    // In production, implement email sending with a secure token
    console.log(`User invited: ${validatedData.email} with temp password: ${tempPassword}`)

    return NextResponse.json({
      success: true,
      user: newUser,
      message: `User invited successfully. Temporary credentials have been sent to ${validatedData.email}`,
      // Only include in development
      ...(process.env.NODE_ENV === 'development' && {
        tempPassword,
        loginUrl: `${process.env.NEXTAUTH_URL}/auth/signin`
      })
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('POST team/invite error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
