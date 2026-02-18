import { NextRequest } from "next/server";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

/**
 * Cron Job: Send welcome messages to new customers
 * Sends welcome email/SMS to customers created in the last 15 days
 * who haven't received a welcome message yet
 *
 * Setup in vercel.json - crons array
 * Schedule: Every 6 hours
 */

export const GET = withWebhookHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return apiUnauthorized(requestId);
    }

    // Get customers created in last 15 days who haven't received portal access
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const newCustomers = await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: fifteenDaysAgo,
        },
        // Customer must have email or phone
        OR: [
          {
            email: {
              not: { equals: null },
            },
          },
          {
            phone: {
              not: { equals: null },
            },
          },
        ],
        // Haven't received portal token yet (indicates no welcome sent)
        portalToken: null,
      },
      include: {
        organization: true,
      },
    });

    const results = [];
    let emailsSent = 0;
    let smsSent = 0;
    let failed = 0;

    for (const customer of newCustomers) {
      try {
        if (!customer.organization) {
          failed++;
          continue;
        }

        // Auto-enroll in loyalty program if not already enrolled - no points at signup
        let loyaltyPoints = customer.loyaltyPoints || 0;
        if (!customer.loyaltyMember) {
          loyaltyPoints = 0; // No points at signup - only from transactions
          const tier = "BRONZE"; // Everyone starts at BRONZE

          await prisma.customer.update({
            where: { id: customer.id },
            data: {
              loyaltyMember: true,
              loyaltyPoints,
              loyaltyTier: tier as any,
            },
          });
        }

        // Generate portal token (valid for 30 days for welcome messages)
        const token = randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            portalToken: token,
            portalTokenExpiry: expiry,
          },
        });

        const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/loyalty/portal?token=${token}`;
        const orgName = customer.organization.name || "Callmaker24";

        // Send email if customer has email
        if (customer.email && customer.emailOptIn) {
          try {
            await sendWelcomeEmail(
              customer.email,
              customer.firstName || "Valued Customer",
              portalUrl,
              loyaltyPoints,
              orgName,
            );
            emailsSent++;
          } catch {
            // individual email failure — continue
          }
        }

        // Send SMS if customer has phone and opted in
        if (customer.phone && customer.smsOptIn) {
          try {
            await sendWelcomeSMS(
              customer.phone,
              customer.firstName || "Customer",
              portalUrl,
              loyaltyPoints,
              orgName,
            );
            smsSent++;
          } catch {
            // individual SMS failure — continue
          }
        }

        results.push({
          customerId: customer.id,
          email: customer.email,
          phone: customer.phone,
          success: true,
        });
      } catch {
        failed++;
        results.push({
          customerId: customer.id,
          success: false,
          error: "Failed to process customer",
        });
      }
    }

    return apiSuccess(
      {
        timestamp: new Date().toISOString(),
        summary: {
          total: newCustomers.length,
          emailsSent,
          smsSent,
          failed,
        },
        results,
      },
      { requestId },
    );
  },
  { route: "GET /api/cron/welcome-customers" },
);

// Helper function to send welcome email
async function sendWelcomeEmail(
  email: string,
  name: string,
  portalUrl: string,
  points: number,
  orgName: string,
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .points { font-size: 48px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${orgName}!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for being our valued customer! We're excited to have you in our loyalty program.</p>
            
            ${
              points > 0
                ? `
            <p><strong>Great news!</strong> You already have:</p>
            <div class="points">${points} Points</div>
            <p style="text-align: center; color: #666;">Based on $${points} in purchases! 💰</p>
            `
                : `
            <p>Start collecting points with your next purchase! You'll get <strong>1 point for every $1 you spend</strong>.</p>
            `
            }
            
            <h3>🎁 Your Rewards Program Benefits:</h3>
            <ul>
              <li>✨ Get 1 point for every $1 you spend</li>
              <li>🎂 Birthday rewards</li>
              <li>⭐ Exclusive member discounts</li>
              <li>📱 Track your points anytime</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${portalUrl}" class="button">Access Your Portal</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              <strong>Quick Tip:</strong> Save this link to check your points balance, view your purchase history, and redeem rewards anytime!
            </p>
          </div>
          <div class="footer">
            <p>This link is valid for 30 days. You can request a new one anytime.</p>
            <p>${orgName} • Customer Loyalty Program</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"${orgName}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Welcome to ${orgName} Rewards! ${
      points > 0 ? `You have ${points} points` : "Start earning today"
    }`,
    html: emailHtml,
  });
}

// Helper function to send welcome SMS (using Twilio)
async function sendWelcomeSMS(
  phone: string,
  name: string,
  portalUrl: string,
  points: number,
  orgName: string,
) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    return;
  }

  const twilio = require("twilio");
  const client = twilio(accountSid, authToken);

  const message = `Hi ${name}! 🎉 Welcome to ${orgName} Rewards! You earn 1 point for every $1 in purchases. Portal: ${portalUrl}`;

  await client.messages.create({
    body: message,
    from: twilioPhone,
    to: phone,
  });
}
