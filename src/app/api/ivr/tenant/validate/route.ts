import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const Digits = formData.get('Digits') as string
    const From = formData.get('From') as string
    const CallSid = formData.get('CallSid') as string

    const org = await prisma.organization.findFirst({
      where: { companyCode: Digits }
    })

    if (!org) {
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Invalid company code. Please try again.</Say>
  <Redirect>/api/ivr/incoming</Redirect>
</Response>`, { headers: { 'Content-Type': 'text/xml' } })
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${org.ivrConfig?.welcomeMessage || `Welcome to ${org.name}`}</Say>
  <Gather input="dtmf" numDigits="1" action="/api/ivr/menu?orgId=${org.id}&from=${From}&callSid=${CallSid}">
    <Say>Press 1 for Sales. Press 2 for Technical Support. Press 3 for Billing. Press 4 for General Inquiries. Press 0 for Operator.</Say>
  </Gather>
  <Redirect>/api/ivr/menu?orgId=${org.id}&from=${From}&callSid=${CallSid}</Redirect>
</Response>`

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (error) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Error processing request.</Say><Hangup/></Response>`, 
    { headers: { 'Content-Type': 'text/xml' } })
  }
}
