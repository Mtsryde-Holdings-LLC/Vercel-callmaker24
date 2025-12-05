import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const RecordingUrl = formData.get('RecordingUrl') as string
    const From = formData.get('From') as string
    const orgId = formData.get('orgId') as string

    await prisma.voicemail.create({
      data: {
        callerPhone: From,
        recordingUrl: RecordingUrl,
        organizationId: orgId
      }
    })

    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for your message. We will get back to you soon.</Say>
  <Hangup/>
</Response>`, { headers: { 'Content-Type': 'text/xml' } })
  } catch (error) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Hangup/></Response>`, { headers: { 'Content-Type': 'text/xml' } })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const voicemails = await prisma.voicemail.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: voicemails })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch voicemails' }, { status: 500 })
  }
}
