import { NextRequest, NextResponse } from 'next/server';
import { VoiceService } from '@/services/voice.service';

/**
 * Test Call Endpoint
 * 
 * Usage: GET /api/test-call?to=+1234567890
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to');
    const menuId = searchParams.get('menuId');

    if (!to) {
      return NextResponse.json(
        { 
          error: 'Missing "to" parameter',
          usage: 'GET /api/test-call?to=+1234567890&menuId=optional' 
        },
        { status: 400 }
      );
    }

    // Initiate test call
    const result = await VoiceService.initiateCall({
      to,
      menuId: menuId || undefined,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test call initiated successfully!',
        data: result.data,
        recipient: to,
        note: 'The recipient should receive a call momentarily.',
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
    console.error('Test call error:', error);
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
 * POST endpoint for call with custom message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, menuId } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Missing "to" parameter' },
        { status: 400 }
      );
    }

    const result = await VoiceService.initiateCall({
      to,
      menuId,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Call initiated' : 'Call failed',
      data: result.data || { error: result.error },
    });
  } catch (error: any) {
    console.error('Test call error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
