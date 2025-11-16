import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// This endpoint should be secured or removed after initial setup
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, secretKey } = body

    // Security: Require a secret key from environment variable
    const SETUP_SECRET = process.env.SUPER_ADMIN_SETUP_KEY
    
    if (!SETUP_SECRET || secretKey !== SETUP_SECRET) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 403 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Update existing user to super admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'SUPER_ADMIN',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })

      return NextResponse.json({
        message: 'User upgraded to Super Admin',
        user: updatedUser,
      })
    } else {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      )
    }
  } catch (error: any) {
    console.error('[POST /api/admin/setup-super-admin] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
