import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: 'Missing Twilio credentials' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    // Check account status
    const account = await client.api.accounts(accountSid).fetch();
    
    // Check phone number if provided
    let phoneNumberInfo = null;
    if (phoneNumber) {
      try {
        const numbers = await client.incomingPhoneNumbers.list({ phoneNumber });
        phoneNumberInfo = numbers[0] || null;
      } catch (e: any) {
        phoneNumberInfo = { error: e.message };
      }
    }

    // Check messaging service if provided
    let messagingServiceInfo = null;
    if (messagingServiceSid) {
      try {
        messagingServiceInfo = await client.messaging.v1.services(messagingServiceSid).fetch();
      } catch (e: any) {
        messagingServiceInfo = { error: e.message };
      }
    }

    // Get recent messages
    const messages = await client.messages.list({ limit: 10 });

    return NextResponse.json({
      account: {
        sid: account.sid,
        status: account.status,
        type: account.type,
      },
      phoneNumber: phoneNumberInfo,
      messagingService: messagingServiceInfo,
      recentMessages: messages.map(m => ({
        sid: m.sid,
        to: m.to,
        from: m.from,
        status: m.status,
        errorCode: m.errorCode,
        errorMessage: m.errorMessage,
        dateCreated: m.dateCreated,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
    }, { status: 500 });
  }
}
