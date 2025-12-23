import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const customerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  emailOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
});

// GET /api/customers - List all customers
export async function GET(request: NextRequest) {
  try {
    console.log("[CUSTOMERS API] Fetching customers...");
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("[CUSTOMERS API] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CUSTOMERS API] Session user:", session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    console.log(
      "[CUSTOMERS API] User found:",
      !!user,
      "OrgId:",
      user?.organizationId
    );
    const organizationId = user?.organizationId || "cmi6rkqbo0001kn0xyo8383o9";

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "1000");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {
      organizationId: organizationId,
    };

    // Create test customer if none exist
    const customerCount = await prisma.customer.count({ where });
    if (customerCount === 0) {
      await prisma.customer.create({
        data: {
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          phone: "+18327881895",
          organizationId: organizationId,
          createdById: user?.id || "cmi6rkqbx0003kn0x6mitf439",
        },
      });
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tags: true,
          _count: {
            select: {
              emailMessages: true,
              smsMessages: true,
              calls: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    console.log(
      "[CUSTOMERS API] Found",
      customers.length,
      "customers, total:",
      total
    );
    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[CUSTOMERS API] GET error:", error);
    return NextResponse.json(
      {
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    const organizationId = user?.organizationId || "cmi6rkqbo0001kn0xyo8383o9";
    const userId = user?.id || "cmi6rkqbx0003kn0x6mitf439";

    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    // Check if customer already exists in this organization
    if (validatedData.email) {
      const existing = await prisma.customer.findFirst({
        where: {
          email: validatedData.email,
          organizationId: organizationId,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        );
      }
    }

    const { tags, ...customerData } = validatedData;

    // Automatically enroll in loyalty program (1 point per $1 spent)
    const loyaltyPoints = Math.floor(customerData.totalSpent || 0);
    let loyaltyTier = "BRONZE";
    if (loyaltyPoints >= 5000) loyaltyTier = "DIAMOND";
    else if (loyaltyPoints >= 3000) loyaltyTier = "PLATINUM";
    else if (loyaltyPoints >= 1500) loyaltyTier = "GOLD";
    else if (loyaltyPoints >= 500) loyaltyTier = "SILVER";

    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        createdById: userId,
        organizationId: organizationId,
        loyaltyMember: true,
        loyaltyPoints,
        loyaltyTier: loyaltyTier as any,
      },
      include: {
        tags: true,
        organization: true,
      },
    });

    // Send welcome message immediately (non-blocking)
    if (customer.email || customer.phone) {
      sendWelcomeMessage(customer).catch((err) => {
        console.error("[CUSTOMER CREATE] Failed to send welcome message:", err);
      });
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    console.error("POST customer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to send welcome message to new customer
async function sendWelcomeMessage(customer: any) {
  const { randomBytes } = require("crypto");
  const nodemailer = require("nodemailer");

  // Generate portal token (valid for 30 days)
  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      portalToken: token,
      portalTokenExpiry: expiry,
    },
  });

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/loyalty/portal?token=${token}`;
  const orgName = customer.organization?.name || "Callmaker24";
  const name = customer.firstName || "Valued Customer";
  const points = customer.loyaltyPoints || 0;

  // Send email if available
  if (customer.email && customer.emailOptIn !== false) {
    try {
      const transporter = nodemailer.createTransporter({
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
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to ${orgName}!</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                <p>Thank you for joining our loyalty program! We're excited to reward you for being a valued customer.</p>
                ${
                  points > 0
                    ? `
                <div class="points">${points} Points</div>
                <p style="text-align: center;">You've already earned $${points} in rewards!</p>
                `
                    : ""
                }
                <h3>🎁 Your Benefits:</h3>
                <ul>
                  <li>✨ Earn 1 point per $1 spent</li>
                  <li>🎂 Birthday rewards</li>
                  <li>⭐ Exclusive discounts</li>
                  <li>📱 Track points anytime</li>
                </ul>
                <div style="text-align: center;">
                  <a href="${portalUrl}" class="button">Access Your Portal</a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      await transporter.sendMail({
        from: `"${orgName}" <${process.env.SMTP_USER}>`,
        to: customer.email,
        subject: `Welcome to ${orgName} Rewards! ${
          points > 0 ? `${points} points waiting` : ""
        }`,
        html: emailHtml,
      });

      console.log(`[CUSTOMER CREATE] Welcome email sent to ${customer.email}`);
    } catch (emailError) {
      console.error("[CUSTOMER CREATE] Email error:", emailError);
    }
  }

  // Send SMS if available and opted in
  if (customer.phone && customer.smsOptIn) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (accountSid && authToken && twilioPhone) {
        const twilio = require("twilio");
        const client = twilio(accountSid, authToken);

        const message =
          points > 0
            ? `Hi ${name}! 🎉 Welcome to ${orgName} Rewards! You have ${points} points ($${points} earned). Portal: ${portalUrl}`
            : `Hi ${name}! Welcome to ${orgName} Rewards! Earn 1 point per $1. Portal: ${portalUrl}`;

        await client.messages.create({
          body: message,
          from: twilioPhone,
          to: customer.phone,
        });

        console.log(`[CUSTOMER CREATE] Welcome SMS sent to ${customer.phone}`);
      }
    } catch (smsError) {
      console.error("[CUSTOMER CREATE] SMS error:", smsError);
    }
  }
}
