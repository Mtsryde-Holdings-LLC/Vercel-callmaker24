import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Super Admin Verification Code (obtained from emmanuel.o@mtsryde.com)
const SUPER_ADMIN_VERIFICATION_CODE = process.env.SUPER_ADMIN_CODE || ''
const ADMIN_EMAIL = 'emmanuel.o@mtsryde.com'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { verificationCode } = body

    if (!verificationCode) {
      return NextResponse.json(
        { 
          error: 'Verification code required',
          message: `Please contact ${ADMIN_EMAIL} to obtain the Super Admin verification code.`
        },
        { status: 400 }
      )
    }

    // Verify the code
    if (verificationCode !== SUPER_ADMIN_VERIFICATION_CODE) {
      return NextResponse.json(
        { 
          error: 'Invalid verification code',
          message: `The verification code is incorrect. Please contact ${ADMIN_EMAIL} for the correct code.`
        },
        { status: 403 }
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
