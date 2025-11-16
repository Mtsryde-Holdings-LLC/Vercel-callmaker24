import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// This endpoint sets your email as SUPER_ADMIN
// Run this once after deployment to grant yourself super admin access
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Update the current user to SUPER_ADMIN
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        role: 'SUPER_ADMIN',
      },
    })

    return NextResponse.json({
      success: true,
      message: `User ${user.email} is now SUPER_ADMIN`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Error setting super admin:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set super admin' },
      { status: 500 }
    )
  }
}
