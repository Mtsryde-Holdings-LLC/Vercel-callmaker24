import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Super admin credentials - CHANGE THESE IN PRODUCTION!
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@callmaker24.com'
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!'
const SUPER_ADMIN_NAME = 'Super Administrator'

/**
 * Super Admin Auto-Login Endpoint
 * Creates or updates super admin account and returns login credentials
 * 
 * Usage: GET /api/auth/superadmin
 * 
 * SECURITY: Only enable in development or protect with API key in production
 */
export async function GET(req: NextRequest) {
  try {
    // Security check - only allow in development or with secret key
    const isDevelopment = process.env.NODE_ENV === 'development'
    const secretKey = req.headers.get('x-admin-secret')
    const validSecret = process.env.SUPER_ADMIN_SECRET || 'change-this-secret-key'

    if (!isDevelopment && secretKey !== validSecret) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    // Check if super admin exists
    let superAdmin = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
    })

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10)

    if (superAdmin) {
      // Update existing super admin
      superAdmin = await prisma.user.update({
        where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          emailVerified: new Date(),
          name: SUPER_ADMIN_NAME,
        },
      })
    } else {
      // Create new super admin
      superAdmin = await prisma.user.create({
        data: {
          email: SUPER_ADMIN_EMAIL.toLowerCase(),
          password: hashedPassword,
          name: SUPER_ADMIN_NAME,
          role: 'SUPER_ADMIN',
          emailVerified: new Date(),
          authProvider: 'EMAIL',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Super admin account ready',
      credentials: {
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
      },
      loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin`,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
      },
    })
  } catch (error) {
    console.error('Super admin creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create super admin',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Direct Login Endpoint - Auto-creates session
 * Usage: POST /api/auth/superadmin with { "autoLogin": true }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { autoLogin } = body

    if (!autoLogin) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    // Security check
    const isDevelopment = process.env.NODE_ENV === 'development'
    const secretKey = req.headers.get('x-admin-secret')
    const validSecret = process.env.SUPER_ADMIN_SECRET || 'change-this-secret-key'

    if (!isDevelopment && secretKey !== validSecret) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    // Ensure super admin exists
    let superAdmin = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
    })

    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10)
      superAdmin = await prisma.user.create({
        data: {
          email: SUPER_ADMIN_EMAIL.toLowerCase(),
          password: hashedPassword,
          name: SUPER_ADMIN_NAME,
          role: 'SUPER_ADMIN',
          emailVerified: new Date(),
          authProvider: 'EMAIL',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Use these credentials to sign in',
      credentials: {
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
      },
      redirect: '/auth/signin',
    })
  } catch (error) {
    console.error('Super admin auto-login error:', error)
    return NextResponse.json(
      {
        error: 'Failed to setup auto-login',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
