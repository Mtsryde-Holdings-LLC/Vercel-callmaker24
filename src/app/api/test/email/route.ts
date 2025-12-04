import { NextResponse } from 'next/server';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

export async function POST(req: Request) {
  try {
    const { to } = await req.json();

    const mailgun = new Mailgun(formData).client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY!,
      url: process.env.MAILGUN_REGION === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
    });

    const result = await mailgun.messages.create(process.env.MAILGUN_DOMAIN!, {
      from: process.env.EMAIL_FROM || 'noreply@callmaker24.com',
      to: to,
      subject: 'Test Email from CallMaker24',
      html: '<h1>Test Email</h1><p>This is a test email from CallMaker24.</p>',
      text: 'Test Email - This is a test email from CallMaker24.',
    });

    return NextResponse.json({
      success: true,
      result,
      config: {
        domain: process.env.MAILGUN_DOMAIN,
        from: process.env.EMAIL_FROM,
        region: process.env.MAILGUN_REGION,
        provider: process.env.EMAIL_PROVIDER,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: error.details || error,
    }, { status: 500 });
  }
}
