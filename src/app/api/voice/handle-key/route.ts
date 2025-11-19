import { NextRequest, NextResponse } from 'next/server';
import { VoiceService } from '@/services/voice.service';
import twilio from 'twilio';

/**
 * Twilio Voice Key Press Handler
 * 
 * Handles IVR menu selections (when user presses keys)
 * https://www.twilio.com/docs/voice/twiml/gather
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract Twilio data
    const digit = formData.get('Digits') as string;
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    console.log('🔢 IVR Key Press:', {
      digit,
      callSid,
      from,
      to,
    });

    // Validate webhook signature
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
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // Handle key press and generate response
    const twimlResponse = await VoiceService.handleKeyPress(digit, callSid);

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error('❌ Key press handler error:', error);
    
    // Return error TwiML
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say({ voice: 'alice' }, 'An error occurred. Please try again.');
    
    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

/**
 * GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Voice key press handler endpoint is active',
    endpoint: '/api/voice/handle-key',
    method: 'POST',
    configure: 'Referenced in IVR gather action URL',
  });
}
