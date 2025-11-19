import { NextRequest, NextResponse } from 'next/server';
import { VoiceService } from '@/services/voice.service';
import twilio from 'twilio';

/**
 * Twilio Voice Status Callback Handler
 * 
 * Receives call status updates (initiated, ringing, answered, completed)
 * https://www.twilio.com/docs/voice/api/call-resource#statuscallback
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract Twilio data
    const data = {
      CallSid: formData.get('CallSid') as string,
      CallStatus: formData.get('CallStatus') as string,
      CallDuration: formData.get('CallDuration') as string,
      RecordingUrl: formData.get('RecordingUrl') as string,
      From: formData.get('From') as string,
      To: formData.get('To') as string,
      Direction: formData.get('Direction') as string,
    };

    console.log('📞 Call Status Update:', {
      sid: data.CallSid,
      status: data.CallStatus,
      duration: data.CallDuration,
      direction: data.Direction,
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
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Update call status in database
    await VoiceService.updateCallStatus(
      data.CallSid,
      data.CallStatus,
      data
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Call status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Voice status callback endpoint is active',
    endpoint: '/api/voice/status',
    method: 'POST',
    configure: 'Set this URL in Twilio Console > Phone Numbers > Voice > Status Callback',
  });
}
