import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logger } from "@/lib/logger";

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
  totalSpent: z.number().optional(),
  orderCount: z.number().optional(),
  source: z.string().optional(),
  shopifyId: z.string().optional(),
  externalId: z.string().optional(),
});

// GET /api/customers - List all customers
export const GET = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {
      organizationId,
    };

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

    return apiSuccess(customers, {
      requestId,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  },
  {
    route: "GET /api/customers",
    rateLimit: RATE_LIMITS.standard,
  },
);

// POST /api/customers - Create a new customer
export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, body, requestId }: ApiContext,
  ) => {
    const validatedData = body as z.infer<typeof customerSchema>;

    // Check if customer already exists in this organization
    if (validatedData.email) {
      const existing = await prisma.customer.findFirst({
        where: {
          email: validatedData.email,
          organizationId,
        },
      });

      if (existing) {
        return apiError("Customer with this email already exists", {
          status: 400,
          requestId,
        });
      }
    }

    const { tags, ...customerData } = validatedData;

    // Automatically enroll in loyalty program - no points at signup, only from transactions
    const loyaltyPoints = 0; // No welcome bonus - points only from purchases
    const loyaltyTier = "BRONZE"; // Everyone starts at BRONZE

    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        createdById: session.user.id,
        organizationId,
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
        logger.error(
          "Failed to send welcome message",
          { route: "POST /api/customers", customerId: customer.id },
          err,
        );
      });
    }

    return apiSuccess(customer, { requestId });
  },
  {
    route: "POST /api/customers",
    rateLimit: RATE_LIMITS.standard,
    bodySchema: customerSchema,
  },
);

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
                <p style="text-align: center;">Based on $${points} in purchases!</p>
                `
                    : ""
                }
                <h3>🎁 Your Benefits:</h3>
                <ul>
                  <li>✨ Get 1 point for every $1 you spend</li>
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

      logger.info("Welcome email sent", {
        route: "POST /api/customers",
        email: customer.email,
      });
    } catch (emailError) {
      logger.error(
        "Email error",
        { route: "POST /api/customers", email: customer.email },
        emailError as Error,
      );
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

        const message = `Hi ${name}! 🎉 Welcome to ${orgName} Rewards! You earn 1 point for every $1 in purchases. Portal: ${portalUrl}`;

        await client.messages.create({
          body: message,
          from: twilioPhone,
          to: customer.phone,
        });

        logger.info("Welcome SMS sent", {
          route: "POST /api/customers",
          phone: customer.phone,
        });
      }
    } catch (smsError) {
      logger.error(
        "SMS error",
        { route: "POST /api/customers", phone: customer.phone },
        smsError as Error,
      );
    }
  }
}
