import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { callSid, from, to, status } = body

    await prisma.call.create({
      data: {
        twilioCallSid: callSid,
        direction: 'INBOUND',
        status: status?.toUpperCase() || 'IN_PROGRESS',
        from,
        to,
        organizationId: 'cmirtl4590001j5m9wsq8va37',
        startedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Studio webhook error:', error)
    return NextResponse.json({ success: true })
  }
}
