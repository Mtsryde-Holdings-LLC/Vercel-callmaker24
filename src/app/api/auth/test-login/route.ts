import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@callmaker24.com'
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!'

/**
 * Simple login test endpoint
 * Returns user info if credentials are valid
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    console.log('Testing login for:', email)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      console.error('User not found:', email)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('User found:', { id: user.id, email: user.email, role: user.role })

    // Check password
    if (!user.password) {
      console.error('No password set for user')
      return NextResponse.json(
        { error: 'No password set' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isValid)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: 'Credentials are valid. You can now sign in.'
    })
  } catch (error) {
    console.error('Login test error:', error)
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Check current session
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session'
      })
    }

    return NextResponse.json({
      authenticated: true,
      session,
      message: 'Active session found'
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
