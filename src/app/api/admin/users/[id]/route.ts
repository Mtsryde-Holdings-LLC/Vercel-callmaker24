import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    const userId = session.user.id
    const targetUserId = params.id
    const body = await req.json()
    const { role, permissions } = body

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        organizationId: true,
        assignedBy: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Permission checks
    if (userRole === 'SUPER_ADMIN') {
      // Super admin can update anyone
    } else if (userRole === 'CORPORATE_ADMIN') {
      // Corporate admin can only update users in their organization
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      })

      if (targetUser.organizationId !== currentUser?.organizationId) {
        return NextResponse.json(
          { error: 'Cannot update users from other organizations' },
          { status: 403 }
        )
      }

      // Cannot update other corporate admins or super admins
      if (targetUser.role === 'CORPORATE_ADMIN' || targetUser.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Cannot update admin users' },
          { status: 403 }
        )
      }

      // Cannot promote to corporate admin or super admin
      if (role === 'CORPORATE_ADMIN' || role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Cannot promote users to admin roles' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(role && { role: role as UserRole }),
        ...(permissions !== undefined && { permissions }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error('[PATCH /api/admin/users/:id] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    const userId = session.user.id
    const targetUserId = params.id

    // Cannot delete yourself
    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        organizationId: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Permission checks
    if (userRole === 'SUPER_ADMIN') {
      // Super admin can delete anyone except other super admins
      if (targetUser.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Cannot delete other super admins' },
          { status: 403 }
        )
      }
    } else if (userRole === 'CORPORATE_ADMIN') {
      // Corporate admin can only delete users in their organization
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      })

      if (targetUser.organizationId !== currentUser?.organizationId) {
        return NextResponse.json(
          { error: 'Cannot delete users from other organizations' },
          { status: 403 }
        )
      }

      // Cannot delete other admins
      if (targetUser.role === 'CORPORATE_ADMIN' || targetUser.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Cannot delete admin users' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete user
    await prisma.user.delete({
      where: { id: targetUserId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/admin/users/:id] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
