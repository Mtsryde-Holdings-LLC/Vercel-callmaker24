import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

// Request a magic link to access customer portal
export async function POST(req: NextRequest) {
  try {
    const { email, phone, orgSlug } = await req.json();

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone required" },
        { status: 400 }
      );
    }

    if (!orgSlug) {
      return NextResponse.json(
        { error: "Organization required" },
        { status: 400 }
      );
    }

    // Find organization by slug, or get the first one if not found
    let org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    // If org not found by slug, try to find the first organization
    if (!org) {
      org = await prisma.organization.findFirst();
    }

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Find customer
    const customer = await prisma.customer.findFirst({
      where: {
        organizationId: org.id,
        loyaltyMember: true,
        OR: [email ? { email } : {}, phone ? { phone } : {}].filter(
          (condition) => Object.keys(condition).length > 0
        ),
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Loyalty member not found" },
        { status: 404 }
      );
    }

    // Generate magic link token (valid for 15 minutes)
    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    // Update customer with token
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        portalToken: token,
        portalTokenExpiry: expiry,
      },
    });

    // Generate magic link
    const magicLink = `${process.env.NEXTAUTH_URL}/loyalty/portal?token=${token}`;

    // Send magic link via email
    if (customer.email) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@callmaker24.com",
        to: customer.email,
        subject: `${org.name} - Access Your Loyalty Portal`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">🏆 Loyalty Portal Access</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${
                customer.firstName || "Valued Member"
              },</p>
              
              <p style="margin-bottom: 20px;">Click the button below to access your loyalty portal and view your rewards:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Access Portal
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #667eea; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
                ${magicLink}
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">⏱️ This link expires in 15 minutes</p>
                <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">🔒 For security, don't share this link with anyone</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>${org.name}</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          </body>
          </html>
        `,
      });
    }

    // TODO: Send SMS if customer has phone number
    // You can integrate Twilio here for SMS delivery

    return NextResponse.json({
      success: true,
      message: "Magic link sent! Check your email.",
    });
  } catch (error) {
    console.error("Portal auth request error:", error);
    return NextResponse.json(
      { error: "Failed to send access link" },
      { status: 500 }
    );
  }
}
