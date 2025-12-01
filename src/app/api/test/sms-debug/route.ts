import { NextResponse } from 'next/server'
import { SmsService } from '@/services/sms.service'

export async function POST(req: Request) {
  try {
    const { to, message } = await req.json()
    
    console.log('Testing SMS with:', {
      to,
      message,
      twilioSid: process.env.TWILIO_ACCOUNT_SID,
      twilioPhone: process.env.TWILIO_PHONE_NUMBER
    })

    const result = await SmsService.send({
      to,
      message: message || 'Test SMS from CallMaker24 - Debug Mode'
    })

    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
      env: {
        hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      }
    })
  } catch (error: any) {
    console.error('SMS debug error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}