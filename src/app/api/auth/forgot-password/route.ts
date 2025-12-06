import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 3600000)

    await prisma.user.update({
      where: { email },
      data: {
        verificationCode: token,
        codeExpiry: expiry
      }
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
    
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Reset Your Password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
