import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const MessagingResponse = twilio.twiml.MessagingResponse

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const MessageSid = formData.get('MessageSid') as string
    const From = formData.get('From') as string
    const To = formData.get('To') as string
    const Body = formData.get('Body') as string
    const MessageStatus = formData.get('MessageStatus') as string

    // Log the incoming SMS for debugging
    console.log('Incoming SMS webhook:', {
      MessageSid,
      From,
      To,
      Body,
      MessageStatus,
    })

    // TODO: Process incoming SMS (store in database, trigger workflows, etc.)
    // You can add your business logic here

    // Send TwiML response (optional - for auto-replies)
    const twiml = new MessagingResponse()
    // Uncomment to send auto-reply:
    // twiml.message('Thank you for your message! We will get back to you soon.')

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('SMS webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
