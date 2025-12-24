import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Monthly Rewards Balance Reminder Cron Job
 * Runs on the 1st of each month at 9 AM
 * Sends all loyalty members their balance and eligible discounts
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[MONTHLY REWARDS] Starting monthly reminder job...");

    // Get all organizations
    const organizations = await prisma.organization.findMany({});

    let totalSent = 0;
    let totalFailed = 0;

    // Process each organization
    for (const org of organizations) {
      console.log(`[MONTHLY REWARDS] Processing org: ${org.name}`);

      // Get all loyalty members with email
      const members = await prisma.customer.findMany({
        where: {
          organizationId: org.id,
          loyaltyMember: true,
          email: { not: null },
          emailOptIn: true, // Only send to opted-in customers
        },
      });

      console.log(
        `[MONTHLY REWARDS] Found ${members.length} eligible members in ${org.name}`
      );

      // Get tier configurations for discount info
      const tiers = await prisma.loyaltyTier.findMany({
        where: { organizationId: org.id },
        orderBy: { minPoints: "asc" },
      });

      // Send emails to members
      for (const member of members) {
        try {
          await sendMonthlyRewardsEmail(member, org, tiers);
          totalSent++;
          console.log(`[MONTHLY REWARDS] Sent to ${member.email}`);
        } catch (error) {
          console.error(
            `[MONTHLY REWARDS] Failed to send to ${member.email}:`,
            error
          );
          totalFailed++;
        }

        // Rate limiting - wait 100ms between emails
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `[MONTHLY REWARDS] Completed. Sent: ${totalSent}, Failed: ${totalFailed}`
    );

    return NextResponse.json({
      success: true,
      emailsSent: totalSent,
      emailsFailed: totalFailed,
      message: `Monthly rewards reminder sent to ${totalSent} customers`,
    });
  } catch (error: any) {
    console.error("[MONTHLY REWARDS] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send monthly reminders" },
      { status: 500 }
    );
  }
}

async function sendMonthlyRewardsEmail(customer: any, org: any, tiers: any[]) {
  // Calculate current tier discount
  const currentTier = tiers.find((t) => t.tier === customer.loyaltyTier) || {};
  const tierDiscounts: any = {
    BRONZE: 0,
    SILVER: 5,
    GOLD: 10,
    PLATINUM: 15,
    DIAMOND: 20,
  };

  const currentDiscount = tierDiscounts[customer.loyaltyTier] || 0;

  // Find next tier
  const currentTierIndex = tiers.findIndex(
    (t) => t.tier === customer.loyaltyTier
  );
  const nextTier =
    currentTierIndex >= 0 && currentTierIndex < tiers.length - 1
      ? tiers[currentTierIndex + 1]
      : null;
  const pointsToNextTier = nextTier
    ? nextTier.minPoints - customer.loyaltyPoints
    : 0;

  // Generate tier benefits display
  const tierBenefits: any = {
    BRONZE: ["✨ Earn 1 point per $1 spent", "📧 Exclusive email offers"],
    SILVER: [
      "✨ Earn 1.5 points per $1 spent",
      "💰 5% discount on all purchases",
      "🎉 Early access to sales",
    ],
    GOLD: [
      "✨ Earn 2 points per $1 spent",
      "💰 10% discount on all purchases",
      "🚚 Free standard shipping",
      "🎉 Early access to sales",
    ],
    PLATINUM: [
      "✨ Earn 2.5 points per $1 spent",
      "💰 15% discount on all purchases",
      "🚚 Free express shipping",
      "👥 Priority customer support",
      "🎉 Exclusive member events",
    ],
    DIAMOND: [
      "✨ Earn 3 points per $1 spent",
      "💰 20% discount on all purchases",
      "🚚 Free express shipping",
      "👥 VIP customer support",
      "🎉 Exclusive member events",
      "🎁 Birthday & anniversary gifts",
    ],
  };

  const benefits = tierBenefits[customer.loyaltyTier] || tierBenefits.BRONZE;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .header p { margin: 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; color: #374151; margin-bottom: 20px; }
    .points-card { background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border: 2px solid #667eea; border-radius: 15px; padding: 30px; text-align: center; margin: 25px 0; }
    .points-number { font-size: 56px; font-weight: bold; color: #667eea; margin: 10px 0; }
    .points-label { color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .tier-badge { display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #78350f; padding: 10px 25px; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 15px 0; box-shadow: 0 4px 6px rgba(251, 191, 36, 0.3); }
    .discount-box { background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center; }
    .discount-amount { font-size: 48px; font-weight: bold; color: #10b981; margin: 10px 0; }
    .discount-label { color: #065f46; font-size: 16px; font-weight: 600; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
    .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
    .stat-label { color: #6b7280; font-size: 13px; margin-top: 5px; }
    .benefits-section { background: #f9fafb; border-radius: 12px; padding: 25px; margin: 25px 0; }
    .benefits-title { font-size: 20px; font-weight: bold; color: #374151; margin: 0 0 15px 0; }
    .benefit-item { padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px; color: #4b5563; }
    .benefit-item:last-child { border-bottom: none; }
    .progress-section { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 25px 0; }
    .progress-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 15px 0; }
    .progress-fill { background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; transition: width 0.3s ease; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
    .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5); }
    .tip-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0; }
    .tip-box p { margin: 0; color: #78350f; font-size: 15px; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🏆 Your Monthly Rewards Report</h1>
      <p>${new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hi ${customer.firstName || "Valued Customer"},</p>
      <p>Here's your monthly loyalty rewards summary with all your amazing benefits!</p>

      <!-- Points Balance Card -->
      <div class="points-card">
        <div class="points-label">Available Points</div>
        <div class="points-number">${customer.loyaltyPoints.toLocaleString()}</div>
        <span class="tier-badge">${customer.loyaltyTier} MEMBER</span>
      </div>

      ${
        currentDiscount > 0
          ? `
      <!-- Discount Eligibility -->
      <div class="discount-box">
        <div class="discount-label">🎉 You're Eligible For</div>
        <div class="discount-amount">${currentDiscount}% OFF</div>
        <p style="margin: 10px 0 0 0; color: #065f46; font-size: 14px;">Use your ${customer.loyaltyTier} discount on every purchase!</p>
      </div>
      `
          : ""
      }

      <!-- Account Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${customer.loyaltyPoints.toLocaleString()}</div>
          <div class="stat-label">Earned Points</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(
            customer.loyaltyUsed || 0
          ).toLocaleString()}</div>
          <div class="stat-label">Used Points</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${(customer.totalSpent || 0).toFixed(
            2
          )}</div>
          <div class="stat-label">Total Spent</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${customer.orderCount || 0}</div>
          <div class="stat-label">Orders Placed</div>
        </div>
      </div>

      <!-- Your Benefits -->
      <div class="benefits-section">
        <h3 class="benefits-title">✨ Your ${customer.loyaltyTier} Benefits</h3>
        ${benefits
          .map(
            (benefit: string) => `<div class="benefit-item">${benefit}</div>`
          )
          .join("")}
      </div>

      ${
        nextTier && pointsToNextTier > 0
          ? `
      <!-- Progress to Next Tier -->
      <div class="progress-section">
        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #374151;">
          🎯 Progress to ${nextTier.tier}
        </h3>
        <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
          You're ${pointsToNextTier.toLocaleString()} points away from unlocking ${
              nextTier.tier
            } benefits!
        </p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(
            100,
            (customer.loyaltyPoints / nextTier.minPoints) * 100
          ).toFixed(1)}%"></div>
        </div>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 13px; text-align: right;">
          ${customer.loyaltyPoints.toLocaleString()} / ${nextTier.minPoints.toLocaleString()} points
        </p>
      </div>
      `
          : `
      <!-- Max Tier Achieved -->
      <div class="progress-section" style="text-align: center;">
        <h3 style="margin: 0 0 10px 0; font-size: 20px; color: #374151;">
          🌟 Congratulations!
        </h3>
        <p style="margin: 0; color: #6b7280; font-size: 15px;">
          You've reached the highest tier! Enjoy all premium benefits.
        </p>
      </div>
      `
      }

      <!-- Pro Tip -->
      <div class="tip-box">
        <p><strong>💡 Pro Tip:</strong> Every $1 you spend earns you points. Keep shopping to maintain your tier status and unlock even more rewards!</p>
      </div>

      <!-- Call to Action -->
      <div style="text-align: center;">
        <a href="${process.env.NEXTAUTH_URL}/loyalty/portal?org=${
    org.slug
  }" class="cta-button">
          View Full Rewards Dashboard
        </a>
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Thank you for being a loyal member of ${
          org.name
        }! We appreciate your continued support.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>${org.name}</strong></p>
      <p>Loyalty Rewards Program</p>
      <p style="margin-top: 15px;">This is your automated monthly rewards statement</p>
      <p>Questions? Contact us at ${
        org.supportEmail || "support@callmaker24.com"
      }</p>
    </div>
  </div>
</body>
</html>`;

  // Send via Resend
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "rewards@callmaker24.com",
      to: customer.email,
      subject: `🏆 Your ${
        org.name
      } Rewards: ${customer.loyaltyPoints.toLocaleString()} Points${
        currentDiscount > 0 ? ` + ${currentDiscount}% Discount` : ""
      }`,
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return true;
}
