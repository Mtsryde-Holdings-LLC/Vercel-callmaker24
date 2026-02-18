import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

// Request a magic link to access customer portal
export const POST = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { email, phone, orgSlug } = await request.json();

    if (!email && !phone) {
      return apiError("Email or phone required", { status: 400, requestId });
    }

    if (!orgSlug) {
      return apiError("Organization required", { status: 400, requestId });
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
      return apiError("Organization not found", { status: 404, requestId });
    }

    // Find customer (regardless of loyalty member status)
    // Normalize phone number for flexible matching
    const normalizedPhone = phone?.replace(/\D/g, ""); // Remove all non-digits

    let customer = await prisma.customer.findFirst({
      where: {
        organizationId: org.id,
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
          // Also try matching phone with +1 prefix
          normalizedPhone ? { phone: `+1${normalizedPhone}` } : {},
          // Try matching just the last 10 digits
          normalizedPhone && normalizedPhone.length >= 10
            ? { phone: { endsWith: normalizedPhone.slice(-10) } }
            : {},
        ].filter((condition) => Object.keys(condition).length > 0),
      },
    });

    if (!customer) {
      return apiError(
        "Customer not found. Please contact support to create an account.",
        { status: 404, requestId },
      );
    }

    // Auto-enroll customer if not already a loyalty member
    let isNewEnrollment = false;
    if (!customer.loyaltyMember) {
      isNewEnrollment = true;
      const points = 0; // No points at signup - only from transactions
      const tier = "BRONZE"; // Everyone starts at BRONZE

      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          loyaltyMember: true,
          loyaltyPoints: points,
          loyaltyTier: tier as any,
        },
      });
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

    let emailSent = false;
    let smsSent = false;

    // Send magic link via email
    if (customer.email) {
      try {
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
              
              ${
                isNewEnrollment
                  ? `<div style="background: #10b981; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <p style="margin: 0; font-weight: bold;">🎉 Welcome to our Loyalty Program!</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">You've been enrolled with ${customer.loyaltyPoints} points (${customer.loyaltyTier} tier)</p>
              </div>`
                  : ""
              }
              
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
        emailSent = true;
      } catch {
        // Email send failure is non-critical
      }
    }

    // Send SMS via Twilio if customer has phone number
    if (customer.phone && process.env.TWILIO_ACCOUNT_SID) {
      try {
        const twilio = require("twilio")(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );

        await twilio.messages.create({
          body: `${org.name} Loyalty Portal\n\n${
            isNewEnrollment
              ? `🎉 Welcome! You've been enrolled with ${customer.loyaltyPoints} points (${customer.loyaltyTier} tier)\n\n`
              : ""
          }Access your rewards here:\n${magicLink}\n\nExpires in 15 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: customer.phone,
        });
        smsSent = true;
      } catch {
        // SMS send failure is non-critical
      }
    }

    // Return success if at least one method worked
    if (emailSent || smsSent) {
      return apiSuccess(
        {
          message: emailSent
            ? "Magic link sent! Check your email."
            : "Magic link sent! Check your text messages.",
        },
        { requestId },
      );
    }

    // If no delivery method worked, still return the token info for debugging
    return apiSuccess(
      {
        message: "Access link generated. Link: " + magicLink,
        token, // Include token for testing/debugging
      },
      { requestId },
    );
  },
  {
    route: "POST /api/loyalty/portal/auth/request",
    rateLimit: RATE_LIMITS.auth,
  },
);
