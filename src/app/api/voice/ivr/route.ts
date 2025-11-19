import { NextRequest, NextResponse } from 'next/server';
import { VoiceService } from '@/services/voice.service';
import twilio from 'twilio';

/**
 * Twilio Voice IVR Handler
 * 
 * Handles incoming calls and generates IVR menu
 * https://www.twilio.com/docs/voice/twiml
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');

    // Validate webhook signature
    const formData = await request.formData();
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

    // Generate IVR TwiML
    const twimlResponse = await VoiceService.generateIvrTwiml(menuId || undefined);

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error('❌ Voice IVR error:', error);
    
    // Return error TwiML
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say({ voice: 'alice' }, 'An error occurred. Please try again later.');
    
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
    message: 'Voice IVR endpoint is active',
    endpoint: '/api/voice/ivr',
    method: 'POST',
    configure: 'Set this URL in Twilio Console > Phone Numbers > Voice > A Call Comes In',
  });
}
