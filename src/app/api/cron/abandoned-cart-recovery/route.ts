import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

/**
 * Cron Job: Automated Abandoned Cart Recovery
 * Sends email/SMS to customers who abandoned carts 1+ hours ago
 * 
 * Promotion Details:
 * - Free shipping on orders over $50 (Code: FREE10)
 * - 10% discount (Code: VIP)
 * 
 * Setup in vercel.json - crons array
 * Schedule: Every 30 minutes (*/30 * * * *)
 */

export async function GET(req: NextRequest) {
  try {
    console.log("[ABANDONED CART] Starting recovery job...");

    // Verify authorization (cron secret)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error("[ABANDONED CART] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find abandoned carts that:
    // 1. Were created 1+ hours ago
    // 2. Haven't been recovered
    // 3. Haven't received a reminder yet
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const abandonedCarts = await prisma.abandonedCart.findMany({
      where: {
        recovered: false,
        remindedAt: null,
        createdAt: {
          lte: oneHourAgo,
        },
      },
      include: {
        customer: {
          include: {
            organization: true,
          },
        },
      },
      take: 50, // Process 50 at a time to avoid overload
    });

    console.log(
      `[ABANDONED CART] Found ${abandonedCarts.length} carts to process`
    );

    let emailsSent = 0;
    let smsSent = 0;
    let failed = 0;

    for (const cart of abandonedCarts) {
      try {
        const customer = cart.customer;
        const org = customer.organization;

        if (!org) {
          console.error(
            `[ABANDONED CART] No organization for customer ${customer.id}`
          );
          failed++;
          continue;
        }

        // Determine which promo code to use based on cart value
        const cartTotal = cart.total;
        const promoCode = cartTotal >= 50 ? "FREE10" : "VIP";
        const promoMessage =
          cartTotal >= 50
            ? "FREE SHIPPING with code FREE10"
            : "10% OFF with code VIP";

        // Parse cart items for display
        let itemsList = "";
        try {
          const items = Array.isArray(cart.items) ? cart.items : JSON.parse(cart.items as any);
          itemsList = items
            .map(
              (item: any) =>
                `${item.name || item.title || "Item"} - $${
                  item.price || item.amount || "0.00"
                }`
            )
            .join("\n");
        } catch (e) {
          console.error("[ABANDONED CART] Error parsing items:", e);
          itemsList = "Your selected items";
        }

        // Generate recovery URL (use cartUrl if available, otherwise portal)
        const recoveryUrl =
          cart.cartUrl ||
          `${process.env.NEXTAUTH_URL}/loyalty/portal?org=${org.slug}`;

        // Send Email if customer has email and opted in
        if (customer.email && customer.emailOptIn) {
          try {
            await sendRecoveryEmail(
              customer.email,
              customer.firstName || "Valued Customer",
              org.name,
              cartTotal,
              itemsList,
              promoCode,
              promoMessage,
              recoveryUrl
            );
            emailsSent++;
            console.log(
              `[ABANDONED CART] Email sent to ${customer.email}`
            );
          } catch (emailError) {
            console.error(
              `[ABANDONED CART] Email failed for ${customer.email}:`,
              emailError
            );
          }
        }

        // Send SMS if customer has phone and opted in
        if (customer.phone && customer.smsOptIn) {
          try {
            await sendRecoverySMS(
              customer.phone,
              customer.firstName || "Customer",
              promoCode,
              promoMessage,
              recoveryUrl
            );
            smsSent++;
            console.log(`[ABANDONED CART] SMS sent to ${customer.phone}`);
          } catch (smsError) {
            console.error(
              `[ABANDONED CART] SMS failed for ${customer.phone}:`,
              smsError
            );
          }
        }

        // Mark as reminded
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: {
            remindedAt: new Date(),
          },
        });
      } catch (error: any) {
        console.error(
          `[ABANDONED CART] Error processing cart ${cart.id}:`,
          error
        );
        failed++;
      }
    }

    const summary = {
      success: true,
      processed: abandonedCarts.length,
      emailsSent,
      smsSent,
      failed,
      timestamp: new Date().toISOString(),
    };

    console.log("[ABANDONED CART] Job completed:", summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("[ABANDONED CART] Job failed:", error);
    return NextResponse.json(
      {
        error: "Abandoned cart recovery failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to send recovery email
async function sendRecoveryEmail(
  email: string,
  firstName: string,
  orgName: string,
  cartTotal: number,
  itemsList: string,
  promoCode: string,
  promoMessage: string,
  recoveryUrl: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Your Order</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🛒 You Left Something Behind!</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
          Hi ${firstName},
        </p>
        
        <p style="font-size: 16px; color: #666; line-height: 1.6;">
          We noticed you left some great items in your cart. Don't worry — we've saved them for you!
        </p>
        
        <!-- Cart Items -->
        <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 30px 0;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">Your Cart Items:</h3>
          <div style="color: #666; line-height: 1.8; white-space: pre-line;">
${itemsList}
          </div>
          <div style="border-top: 2px solid #dee2e6; margin-top: 15px; padding-top: 15px;">
            <p style="font-size: 20px; font-weight: bold; color: #333; margin: 0;">
              Total: $${cartTotal.toFixed(2)}
            </p>
          </div>
        </div>
        
        <!-- Promo Banner -->
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; padding: 25px; text-align: center; margin: 30px 0;">
          <p style="color: white; font-size: 24px; font-weight: bold; margin: 0 0 10px 0;">
            🎉 SPECIAL OFFER!
          </p>
          <p style="color: white; font-size: 18px; margin: 0 0 15px 0;">
            ${promoMessage}
          </p>
          <div style="background: white; border-radius: 8px; padding: 12px 20px; display: inline-block;">
            <p style="color: #f5576c; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">
              ${promoCode}
            </p>
          </div>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${recoveryUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            Complete Your Order →
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">
          This offer is valid for a limited time. Complete your order soon!
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
          Questions? We're here to help!
        </p>
        <p style="color: #999; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} ${orgName}. All rights reserved.
        </p>
      </div>
    </div>
  </body>
</html>
  `;

  await transporter.sendMail({
    from: `"${orgName}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `🛒 Complete Your Order & Get ${promoMessage}!`,
    html: emailHtml,
  });
}

// Helper function to send recovery SMS (using Twilio)
async function sendRecoverySMS(
  phone: string,
  firstName: string,
  promoCode: string,
  promoMessage: string,
  recoveryUrl: string
) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    throw new Error("Twilio credentials not configured");
  }

  const twilio = require("twilio");
  const client = twilio(accountSid, authToken);

  const message = `🛒 Hi ${firstName}! You left items in your cart. ${promoMessage}! Use code: ${promoCode}. Complete order: ${recoveryUrl}`;

  await client.messages.create({
    body: message,
    from: twilioPhone,
    to: phone,
  });
}
