import { NextRequest, NextResponse } from 'next/server';
import { SmsService } from '@/services/sms.service';
import twilio from 'twilio';

/**
 * Twilio SMS Webhook Handler
 * 
 * Receives incoming SMS messages from Twilio
 * https://www.twilio.com/docs/sms/twiml
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract Twilio data
    const data = {
      MessageSid: formData.get('MessageSid') as string,
      From: formData.get('From') as string,
      To: formData.get('To') as string,
      Body: formData.get('Body') as string,
      NumMedia: formData.get('NumMedia') as string,
      MediaUrl0: formData.get('MediaUrl0') as string,
    };

    console.log('📱 Incoming SMS:', {
      from: data.From,
      to: data.To,
      body: data.Body?.substring(0, 50),
    });

    // Validate webhook signature (security)
    const signature = request.headers.get('x-twilio-signature') || '';
    const url = request.url;
    
    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      url,
      Object.fromEntries(formData)
    );

    if (!isValid) {
      console.error('❌ Invalid Twilio signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Process incoming SMS
    await SmsService.handleIncoming(data);

    // Respond with TwiML (optional auto-reply)
    const MessagingResponse = twilio.twiml.MessagingResponse;
    const twiml = new MessagingResponse();
    
    // Uncomment to send auto-reply:
    // twiml.message('Thanks for your message! We will respond shortly.');

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error('❌ SMS webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook testing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'SMS webhook endpoint is active',
    endpoint: '/api/sms/webhook',
    method: 'POST',
    configure: 'Set this URL in Twilio Console > Phone Numbers > Messaging',
  });
}
