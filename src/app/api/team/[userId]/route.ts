import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/team/[userId] - Remove a user from the organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    // Check if user has permission to remove users
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { userId } = params

    // Cannot remove yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    // Get the user to verify they're in the same organization
    const userToRemove = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true }
    })

    if (!userToRemove) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userToRemove.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'User not in your organization' }, { status: 403 })
    }

    // SUB_ADMIN cannot remove ADMIN or other SUB_ADMIN
    if (session.user.role === 'SUB_ADMIN' && userToRemove.role !== 'AGENT') {
      return NextResponse.json({ error: 'Cannot remove users with equal or higher role' }, { status: 403 })
    }

    // Remove organizationId instead of deleting the user (soft removal)
    await prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: null,
        assignedBy: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User removed from organization successfully'
    })
  } catch (error: any) {
    console.error('DELETE team/userId error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
