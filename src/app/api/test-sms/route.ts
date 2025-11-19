import { NextRequest, NextResponse } from 'next/server';
import { SmsService } from '@/services/sms.service';

/**
 * Test SMS Sending Endpoint
 * 
 * Usage: GET /api/test-sms?to=+1234567890
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to');

    if (!to) {
      return NextResponse.json(
        { 
          error: 'Missing "to" parameter',
          usage: 'GET /api/test-sms?to=+1234567890' 
        },
        { status: 400 }
      );
    }

    // Send test SMS
    const result = await SmsService.send({
      to,
      message: `🎉 Test SMS from CallMaker24!

Your Twilio SMS integration is working perfectly.

Sent at: ${new Date().toLocaleString()}

This confirms:
✅ Account SID configured
✅ Auth Token valid
✅ Phone number active
✅ SMS capability enabled

You're ready to send SMS to your customers!`,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test SMS sent successfully!',
        data: result.data,
        recipient: to,
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test SMS error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for batch testing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients } = body;

    if (!recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Missing or invalid "recipients" array' },
        { status: 400 }
      );
    }

    const messages = recipients.map((to: string) => ({
      to,
      message: `Test SMS from CallMaker24! Sent at ${new Date().toLocaleString()}`,
    }));

    const result = await SmsService.sendBatch(messages);

    return NextResponse.json({
      success: true,
      message: 'Batch SMS sent',
      ...result,
    });
  } catch (error: any) {
    console.error('Batch test SMS error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
