import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send verification code via email (placeholder - implement with your email service)
async function sendVerificationEmail(email: string, code: string) {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`Sending verification code ${code} to ${email}`)
  // For now, just log it
}

// Send verification code via SMS (using Twilio)
async function sendVerificationSMS(phone: string, code: string) {
  // TODO: Integrate with Twilio
  console.log(`Sending verification code ${code} to ${phone}`)
  // For now, just log it
}

export async function POST(req: NextRequest) {
  try {
    const { email, method } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode()
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update user with new code
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        verificationCode,
        codeExpiry,
      },
    })

    // Send code based on method
    if (method === 'sms' && user.phone) {
      await sendVerificationSMS(user.phone, verificationCode)
    } else {
      await sendVerificationEmail(user.email, verificationCode)
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
    })
  } catch (error) {
    console.error('Resend MFA error:', error)
    return NextResponse.json(
      {
        error: 'Failed to resend verification code',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
