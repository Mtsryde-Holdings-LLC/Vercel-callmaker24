import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import twilio from 'twilio'

// Initialize AWS SES client (only if credentials are available)
const sesClient = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null

// Lazy initialize Twilio client only when needed
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  
  // Only initialize if both credentials are valid and not placeholders
  if (accountSid && authToken && accountSid.startsWith('AC') && authToken !== 'placeholder') {
    return twilio(accountSid, authToken)
  }
  return null
}

/**
 * Send verification code via email using AWS SES
 */
export async function sendVerificationEmail(email: string, code: string, name?: string) {
  const fromEmail = process.env.AWS_SES_FROM_EMAIL || 'noreply@callmaker24.com'
  
  const params = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: 'Verify Your CallMaker24 Account',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .code-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; color: #667eea; }
                  .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Welcome to CallMaker24!</h1>
                  </div>
                  <div class="content">
                    <p>Hello ${name || 'there'},</p>
                    <p>Thank you for signing up! To complete your registration, please enter the verification code below:</p>
                    <div class="code-box">${code}</div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't create an account with CallMaker24, please ignore this email.</p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} CallMaker24. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
          Charset: 'UTF-8',
        },
        Text: {
          Data: `Welcome to CallMaker24!\n\nYour verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't create an account, please ignore this email.`,
          Charset: 'UTF-8',
        },
      },
    },
  }

  try {
    if (!sesClient) {
      console.error('AWS SES not configured')
      throw new Error('Email service not configured')
    }
    const command = new SendEmailCommand(params)
    await sesClient.send(command)
    console.log(`Verification email sent to ${email}`)
    return { success: true }
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw new Error('Failed to send verification email')
  }
}

/**
 * Send verification code via SMS using Twilio
 */
export async function sendVerificationSMS(phone: string, code: string) {
  const twilioClient = getTwilioClient()
  
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.error('Twilio credentials not configured')
    throw new Error('SMS service not configured')
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Your CallMaker24 verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })

    console.log(`Verification SMS sent to ${phone}, SID: ${message.sid}`)
    return { success: true, sid: message.sid }
  } catch (error) {
    console.error('Error sending verification SMS:', error)
    throw new Error('Failed to send verification SMS')
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const fromEmail = process.env.AWS_SES_FROM_EMAIL || 'noreply@callmaker24.com'
  
  const params = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: 'Welcome to CallMaker24 - Your Account is Ready!',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                  .features { margin: 20px 0; }
                  .feature { padding: 10px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Welcome to CallMaker24!</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${name},</p>
                    <p>Your account has been successfully verified! You're now ready to start automating your customer communications.</p>
                    
                    <div class="features">
                      <div class="feature">✓ AI-powered voice calls</div>
                      <div class="feature">✓ Automated SMS campaigns</div>
                      <div class="feature">✓ Email marketing</div>
                      <div class="feature">✓ Real-time analytics</div>
                    </div>

                    <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Get Started</a>

                    <p>If you have any questions, our support team is here to help!</p>
                    <p>Best regards,<br>The CallMaker24 Team</p>
                  </div>
                </div>
              </body>
            </html>
          `,
          Charset: 'UTF-8',
        },
        Text: {
          Data: `Hi ${name},\n\nYour account has been successfully verified! You're now ready to start automating your customer communications.\n\nGet started at: ${process.env.NEXTAUTH_URL}/dashboard\n\nBest regards,\nThe CallMaker24 Team`,
          Charset: 'UTF-8',
        },
      },
    },
  }

  try {
    if (!sesClient) {
      console.error('AWS SES not configured')
      // Don't throw for welcome email - it's not critical
      return { success: false }
    }
    const command = new SendEmailCommand(params)
    await sesClient.send(command)
    console.log(`Welcome email sent to ${email}`)
    return { success: true }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    // Don't throw error for welcome email - it's not critical
    return { success: false }
  }
}
