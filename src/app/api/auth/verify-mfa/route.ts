import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // Find user with pending verification
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if code matches and hasn't expired
    const storedCode = user.verificationCode
    const codeExpiry = user.codeExpiry

    if (!storedCode || !codeExpiry) {
      return NextResponse.json(
        { error: 'No verification code found for this account' },
        { status: 400 }
      )
    }

    if (new Date() > codeExpiry) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    if (storedCode !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Verify user and clear verification code
    const verifiedUser = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        emailVerified: new Date(),
        verificationCode: null,
        codeExpiry: null,
      },
    })

    // Send welcome email (non-blocking)
    if (verifiedUser.name && verifiedUser.email) {
      sendWelcomeEmail(verifiedUser.email, verifiedUser.name).catch(err => {
        console.error('Failed to send welcome email:', err)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account verified successfully',
    })
  } catch (error) {
    console.error('MFA verification error:', error)
    return NextResponse.json(
      {
        error: 'Failed to verify code',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
