import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(req: Request) {
  try {
    const { to } = await req.json();
    
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      body: 'Test SMS from CallMaker24',
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    // Fetch full details
    const details = await client.messages(message.sid).fetch();

    return NextResponse.json({
      sid: details.sid,
      status: details.status,
      to: details.to,
      from: details.from,
      errorCode: details.errorCode,
      errorMessage: details.errorMessage,
      dateCreated: details.dateCreated,
      dateSent: details.dateSent,
      dateUpdated: details.dateUpdated,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
