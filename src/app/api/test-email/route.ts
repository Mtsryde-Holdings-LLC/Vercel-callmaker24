import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/services/email.service'

/**
 * Test endpoint to send a welcome email via Mailgun
 * GET /api/test-email?to=your-email@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const toEmail = searchParams.get('to')

    if (!toEmail) {
      return NextResponse.json(
        { error: 'Please provide a recipient email: ?to=your-email@example.com' },
        { status: 400 }
      )
    }

    // Send welcome email
    const result = await EmailService.send({
      to: toEmail,
      subject: '🎉 Welcome to CallMaker24!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .features {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .feature-item {
              margin: 10px 0;
              padding-left: 25px;
              position: relative;
            }
            .feature-item:before {
              content: "✓";
              position: absolute;
              left: 0;
              color: #667eea;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚀 Welcome to CallMaker24!</h1>
            <p style="font-size: 18px; margin: 10px 0 0 0;">Your journey to amazing email & SMS campaigns starts here</p>
          </div>
          
          <div class="content">
            <h2>Hi there! 👋</h2>
            <p>
              We're thrilled to have you join CallMaker24! You now have access to one of the most powerful
              email and SMS marketing platforms designed to help you connect with your customers.
            </p>

            <div class="features">
              <h3>🎯 What You Can Do:</h3>
              <div class="feature-item">Send beautiful email campaigns to unlimited contacts</div>
              <div class="feature-item">Create SMS marketing campaigns with high deliverability</div>
              <div class="feature-item">Manage your contacts and segment your audience</div>
              <div class="feature-item">Track opens, clicks, and engagement in real-time</div>
              <div class="feature-item">Use AI-powered tools to optimize your campaigns</div>
              <div class="feature-item">Integrate with Stripe for subscription management</div>
            </div>

            <center>
              <a href="http://localhost:3000/dashboard" class="button">
                Go to Your Dashboard →
              </a>
            </center>

            <h3>📚 Getting Started:</h3>
            <p>Here are some quick steps to get you up and running:</p>
            <ol>
              <li><strong>Import Your Contacts:</strong> Add your existing contacts or import from CSV</li>
              <li><strong>Create Your First Campaign:</strong> Use our templates or design your own</li>
              <li><strong>Send & Track:</strong> Launch your campaign and watch the analytics roll in</li>
            </ol>

            <h3>💡 Need Help?</h3>
            <p>
              Our support team is here for you 24/7. Check out our documentation or reach out anytime:
            </p>
            <ul>
              <li>📖 <a href="http://localhost:3000/docs">Documentation</a></li>
              <li>💬 <a href="mailto:support@callmaker24.com">support@callmaker24.com</a></li>
              <li>🎥 <a href="http://localhost:3000/tutorials">Video Tutorials</a></li>
            </ul>

            <p>
              Thanks for choosing CallMaker24. We can't wait to see what you'll create! 🎨
            </p>

            <p>
              <strong>Cheers,</strong><br>
              The CallMaker24 Team
            </p>
          </div>

          <div class="footer">
            <p>
              <strong>CallMaker24</strong><br>
              Email & SMS Marketing Platform<br>
              <a href="http://localhost:3000/unsubscribe">Unsubscribe</a> | 
              <a href="http://localhost:3000/privacy">Privacy Policy</a>
            </p>
            <p>
              This email was sent via Mailgun | Powered by CallMaker24
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to CallMaker24!

Hi there! 👋

We're thrilled to have you join CallMaker24! You now have access to one of the most powerful email and SMS marketing platforms.

What You Can Do:
• Send beautiful email campaigns to unlimited contacts
• Create SMS marketing campaigns with high deliverability
• Manage your contacts and segment your audience
• Track opens, clicks, and engagement in real-time
• Use AI-powered tools to optimize your campaigns
• Integrate with Stripe for subscription management

Getting Started:
1. Import Your Contacts: Add your existing contacts or import from CSV
2. Create Your First Campaign: Use our templates or design your own
3. Send & Track: Launch your campaign and watch the analytics roll in

Need Help?
• Documentation: http://localhost:3000/docs
• Support: support@callmaker24.com
• Video Tutorials: http://localhost:3000/tutorials

Thanks for choosing CallMaker24!

Cheers,
The CallMaker24 Team

---
CallMaker24 - Email & SMS Marketing Platform
Unsubscribe: http://localhost:3000/unsubscribe
      `,
      tags: [
        { name: 'type', value: 'welcome' },
        { name: 'campaign', value: 'onboarding' }
      ]
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '✅ Welcome email sent successfully!',
        provider: result.provider,
        data: result.data,
        details: {
          to: toEmail,
          subject: '🎉 Welcome to CallMaker24!',
          sentVia: 'Mailgun',
          tracking: 'Enabled (opens & clicks)'
        }
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          provider: result.provider
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
