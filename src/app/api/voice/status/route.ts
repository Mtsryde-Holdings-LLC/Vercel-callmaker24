import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const callSid = formData.get('CallSid') as string
    const status = formData.get('CallStatus') as string
    const duration = formData.get('CallDuration') as string

    await prisma.call.update({
      where: { twilioCallSid: callSid },
      data: {
        status: status.toUpperCase() as any,
        duration: parseInt(duration) || 0,
        endedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
