import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    // Get organization details
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get all loyalty members with email
    const members = await prisma.customer.findMany({
      where: {
        organizationId: orgId,
        loyaltyMember: true,
        email: { not: null },
      },
      take: 100, // Limit batch size
    });

    // Start background processing - don't wait
    const sendPromise = sendEmailsInBackground(members, org);

    // Return immediately
    return NextResponse.json({
      success: true,
      queued: members.length,
      message: "Emails are being sent in the background",
    });
  } catch (error) {
    console.error("Send balance error:", error);
    return NextResponse.json(
      { error: "Failed to queue balance emails" },
      { status: 500 }
    );
  }
}

async function sendEmailsInBackground(members: any[], org: any) {
  const emailPromises = members.map(async (member) => {
    if (!member.email) return false;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .points-box { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .points { font-size: 48px; font-weight: bold; color: #667eea; }
    .tier { display: inline-block; background: #fbbf24; color: #78350f; padding: 8px 20px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .benefits { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .benefit-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 Your Loyalty Rewards Balance</h1>
      <p>Monthly Statement</p>
    </div>
    <div class="content">
      <p>Hi ${member.firstName || "Valued Customer"},</p>
      
      <div class="points-box">
        <div class="points">${member.loyaltyPoints || 0}</div>
        <p style="margin: 0; color: #6b7280;">Available Points</p>
        <span class="tier">${member.loyaltyTier || "BRONZE"} Member</span>
      </div>

      <div class="benefits">
        <h3 style="margin-top: 0;">📊 Your Account Summary</h3>
        <div class="benefit-item">
          <strong>Total Earned:</strong> ${member.loyaltyPoints || 0} points
        </div>
        <div class="benefit-item">
          <strong>Total Used:</strong> ${member.loyaltyUsed || 0} points
        </div>
        <div class="benefit-item">
          <strong>Total Spent:</strong> $${(member.totalSpent || 0).toFixed(2)}
        </div>
        <div class="benefit-item">
          <strong>Total Orders:</strong> ${member.orderCount || 0}
        </div>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>💡 Tip:</strong> Redeem your points for exclusive discounts and rewards!</p>
      </div>

      <p>Thank you for being a loyal member of ${org.name}!</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/loyalty/signup?org=${org.slug}" 
           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          View My Rewards
        </a>
      </div>
    </div>
    <div class="footer">
      <p>${org.name} | Loyalty Rewards Program</p>
      <p>This is an automated monthly statement</p>
    </div>
  </div>
</body>
</html>`;

    try {
      // Send email using Resend
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "noreply@callmaker24.com",
          to: member.email,
          subject: `🏆 Your ${org.name} Loyalty Balance - ${
            member.loyaltyPoints || 0
          } Points`,
          html: emailHtml,
        }),
      });

      return resendRes.ok;
    } catch (error) {
      console.error(`Failed to send email to ${member.email}:`, error);
      return false;
    }
  });

  // Process in parallel batches
  const results = await Promise.all(emailPromises);
  const sent = results.filter(Boolean).length;

  console.log(`✅ Sent ${sent} of ${members.length} balance emails`);
  return sent;
}
