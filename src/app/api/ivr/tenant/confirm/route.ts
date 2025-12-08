import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  const From = searchParams.get('from')
  const CallSid = searchParams.get('callSid')
  
  const formData = await req.formData()
  const Digits = formData.get('Digits') as string

  if (Digits === '1' && orgId) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } })
    
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${org?.ivrConfig?.welcomeMessage || `Welcome to ${org?.name}`}</Say>
  <Gather input="dtmf" numDigits="1" action="/api/ivr/menu?orgId=${orgId}&from=${From}&callSid=${CallSid}">
    <Say>Press 1 for Sales. Press 2 for Technical Support. Press 3 for Billing. Press 4 for General Inquiries. Press 0 for Operator.</Say>
  </Gather>
</Response>`, { headers: { 'Content-Type': 'text/xml' } })
  }

  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect>/api/ivr/incoming</Redirect>
</Response>`, { headers: { 'Content-Type': 'text/xml' } })
}
