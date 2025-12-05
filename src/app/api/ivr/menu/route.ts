import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  const From = searchParams.get('from')
  const CallSid = searchParams.get('callSid')
  
  const formData = await req.formData()
  const Digits = formData.get('Digits') as string

  const departments: Record<string, string> = {
    '1': 'Sales',
    '2': 'Technical Support',
    '3': 'Billing',
    '4': 'General Inquiries'
  }

  if (Digits === '0') {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting you to an operator.</Say>
  <Dial>
    <Queue>operator-${orgId}</Queue>
  </Dial>
</Response>`, { headers: { 'Content-Type': 'text/xml' } })
  }

  const dept = departments[Digits]
  if (dept) {
    await prisma.call.create({
      data: {
        from: From || '',
        to: '',
        direction: 'INBOUND',
        status: 'IN_PROGRESS',
        twilioCallSid: CallSid,
        ivrPath: [dept],
        organizationId: orgId,
        startedAt: new Date()
      }
    })

    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>You selected ${dept}. Please hold while we connect you.</Say>
  <Enqueue waitUrl="/api/ivr/hold-music">${dept.toLowerCase().replace(' ', '-')}-${orgId}</Enqueue>
</Response>`, { headers: { 'Content-Type': 'text/xml' } })
  }

  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Invalid selection.</Say>
  <Redirect>/api/ivr/menu?orgId=${orgId}&from=${From}&callSid=${CallSid}</Redirect>
</Response>`, { headers: { 'Content-Type': 'text/xml' } })
}
