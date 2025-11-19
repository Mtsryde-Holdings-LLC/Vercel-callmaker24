import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/organization - Get current user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true
      }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      organization: user.organization
    })
  } catch (error: any) {
    console.error('Get organization error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/organization - Update organization settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true
      }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Check if user is admin
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update organization settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, logo, domain, settings } = body

    // Update organization
    const updatedOrg = await prisma.organization.update({
      where: { id: user.organization.id },
      data: {
        ...(name && { name }),
        ...(logo !== undefined && { logo }),
        ...(domain && { domain }),
        ...(settings && { settings }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully',
      organization: updatedOrg
    })
  } catch (error: any) {
    console.error('Update organization error:', error)
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}
