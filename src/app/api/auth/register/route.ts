import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send verification code via email (placeholder - implement with your email service)
async function sendVerificationEmail(email: string, code: string) {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`Sending verification code ${code} to ${email}`)
  // For development, you can see the code in console
}

// Send verification code via SMS (using Twilio)
async function sendVerificationSMS(phone: string, code: string) {
  // TODO: Integrate with Twilio
  console.log(`Sending verification code ${code} to ${phone}`)
  // For development, you can see the code in console
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone, mfaMethod } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Validate MFA method
    if (mfaMethod === 'sms' && !phone) {
      return NextResponse.json(
        { error: 'Phone number is required for SMS verification' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create user with verification code
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        mfaMethod: mfaMethod || 'email',
        verificationCode,
        codeExpiry,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        mfaMethod: true,
        createdAt: true,
      },
    })

    // Send verification code
    if (mfaMethod === 'sms' && phone) {
      await sendVerificationSMS(phone, verificationCode)
    } else {
      await sendVerificationEmail(email, verificationCode)
    }

    return NextResponse.json(
      { 
        message: 'User created successfully. Verification code sent.',
        user,
        // For development only - remove in production
        devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Return more specific error information
    return NextResponse.json(
      { 
        error: 'Failed to create account',
        details: error.message || 'Unknown error',
        code: error.code
      },
      { status: 500 }
    )
  }
}
