import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

/**
 * Cron Job: Send welcome messages to new customers
 * Sends welcome email/SMS to customers created in the last 15 days
 * who haven't received a welcome message yet
 *
 * Setup in vercel.json - crons array
 * Schedule: Every 6 hours
 */

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[WELCOME CRON] Starting welcome message sending...");

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
        // Haven't received portal token yet (or token expired)
        AND: [
          {
            OR: [
              { portalToken: null },
              { portalTokenExpiry: { lt: new Date() } },
              { lastPortalLogin: null },
            ],
          },
        ],
      },
      include: {
        organization: true,
      },
    });

    console.log(
      `[WELCOME CRON] Found ${newCustomers.length} new customers to welcome`
    );

    const results = [];
    let emailsSent = 0;
    let smsSent = 0;
    let failed = 0;

    for (const customer of newCustomers) {
      try {
        if (!customer.organization) {
          console.log(
            `[WELCOME CRON] Skipping customer ${customer.id} - no organization`
          );
          failed++;
          continue;
        }

        // Auto-enroll in loyalty program if not already enrolled
        let loyaltyPoints = customer.loyaltyPoints || 0;
        if (!customer.loyaltyMember) {
          loyaltyPoints = Math.floor(customer.totalSpent || 0);
          let tier = "BRONZE";
          if (loyaltyPoints >= 5000) tier = "DIAMOND";
          else if (loyaltyPoints >= 3000) tier = "PLATINUM";
          else if (loyaltyPoints >= 1500) tier = "GOLD";
          else if (loyaltyPoints >= 500) tier = "SILVER";

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
              orgName
            );
            emailsSent++;
            console.log(`[WELCOME CRON] Sent email to ${customer.email}`);
          } catch (emailError) {
            console.error(
              `[WELCOME CRON] Email failed for ${customer.email}:`,
              emailError
            );
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
              orgName
            );
            smsSent++;
            console.log(`[WELCOME CRON] Sent SMS to ${customer.phone}`);
          } catch (smsError) {
            console.error(
              `[WELCOME CRON] SMS failed for ${customer.phone}:`,
              smsError
            );
          }
        }

        results.push({
          customerId: customer.id,
          email: customer.email,
          phone: customer.phone,
          success: true,
        });
      } catch (error: any) {
        console.error(
          `[WELCOME CRON] Error processing customer ${customer.id}:`,
          error
        );
        failed++;
        results.push({
          customerId: customer.id,
          success: false,
          error: error.message,
        });
      }
    }

    console.log("[WELCOME CRON] Complete", {
      total: newCustomers.length,
      emailsSent,
      smsSent,
      failed,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: newCustomers.length,
        emailsSent,
        smsSent,
        failed,
      },
      results,
    });
  } catch (error: any) {
    console.error("[WELCOME CRON] Fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Welcome sending failed" },
      { status: 500 }
    );
  }
}

// Helper function to send welcome email
async function sendWelcomeEmail(
  email: string,
  name: string,
  portalUrl: string,
  points: number,
  orgName: string
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
            <p><strong>Great news!</strong> You've already earned:</p>
            <div class="points">${points} Points</div>
            <p style="text-align: center; color: #666;">That's $${points} in purchases! 💰</p>
            `
                : `
            <p>Start earning points with your next purchase! You'll earn <strong>1 point for every $1 spent</strong>.</p>
            `
            }
            
            <h3>🎁 Your Rewards Program Benefits:</h3>
            <ul>
              <li>✨ Earn 1 point per $1 spent</li>
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
  orgName: string
) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    console.log("[WELCOME CRON] Twilio not configured, skipping SMS");
    return;
  }

  const twilio = require("twilio");
  const client = twilio(accountSid, authToken);

  const message =
    points > 0
      ? `Hi ${name}! 🎉 Welcome to ${orgName} Rewards! You already have ${points} points ($${points} earned). Check your portal: ${portalUrl}`
      : `Hi ${name}! Welcome to ${orgName} Rewards! Earn 1 point per $1 spent. Access your portal: ${portalUrl}`;

  await client.messages.create({
    body: message,
    from: twilioPhone,
    to: phone,
  });
}
