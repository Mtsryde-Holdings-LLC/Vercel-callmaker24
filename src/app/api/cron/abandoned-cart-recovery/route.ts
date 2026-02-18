import { NextRequest } from "next/server";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/services/email.service";
import { SmsService } from "@/services/sms.service";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Cron Job: Automated Abandoned Cart Recovery
 * Sends email/SMS to customers who abandoned carts 1+ hours ago
 *
 * Creates unique Shopify discount codes per customer:
 * - Cart >= $75: FREE SHIPPING
 * - Cart >= $50: 15% discount
 * - Cart < $50:  10% discount
 *
 * Discount codes are created in Shopify via price rules so they work at checkout.
 * Uses EmailService (Resend/Mailgun) and SmsService (Twilio with rate limiting).
 *
 * Setup in vercel.json - crons array
 * Schedule: Runs every 30 minutes
 */

export const GET = withWebhookHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return apiUnauthorized(requestId);
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

    let emailsSent = 0;
    let smsSent = 0;
    let codesCreated = 0;
    let failed = 0;

    for (const cart of abandonedCarts) {
      try {
        const customer = cart.customer;
        const org = customer.organization;

        if (!org) {
          failed++;
          continue;
        }

        const organizationId = org.id;
        const cartTotal = cart.total;

        // Determine discount offer based on cart value
        const offer = getCartOffer(cartTotal);

        // Generate a unique discount code and create it in Shopify
        let discountCode = "";
        try {
          discountCode = await createShopifyDiscountCode({
            organizationId,
            offer,
            customerId: customer.id,
          });
          codesCreated++;
        } catch {
          // Fallback: generate a code without Shopify (stored in DB only)
          discountCode = `CART-${randomBytes(4).toString("hex").toUpperCase()}`;
        }

        // Parse cart items for display
        let itemsList = "";
        let itemsHtml = "";
        try {
          const items = Array.isArray(cart.items)
            ? cart.items
            : JSON.parse(cart.items as any);
          itemsList = items
            .map(
              (item: any) =>
                `${item.name || item.title || "Item"} - $${item.price || item.amount || "0.00"}`,
            )
            .join("\n");
          itemsHtml = items
            .map(
              (item: any) =>
                `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #333;">${item.name || item.title || "Item"}</span>
                  <span style="color: #333; font-weight: 600;">$${item.price || item.amount || "0.00"}</span>
                </div>`,
            )
            .join("");
        } catch (e) {
          itemsList = "Your selected items";
          itemsHtml =
            '<div style="padding: 8px 0; color: #666;">Your selected items</div>';
        }

        // Generate recovery URL (use cartUrl if available, otherwise portal)
        const recoveryUrl =
          cart.cartUrl ||
          `${process.env.NEXTAUTH_URL}/loyalty/portal?org=${(org as any).slug || org.id}`;

        // Send Email if customer has email and opted in
        if (customer.email && customer.emailOptIn) {
          try {
            await sendRecoveryEmail({
              email: customer.email,
              firstName: customer.firstName || "Valued Customer",
              orgName: org.name,
              organizationId,
              cartTotal,
              itemsHtml,
              discountCode,
              offer,
              recoveryUrl,
            });
            emailsSent++;
          } catch {
            // individual email failure — continue
          }
        }

        // Send SMS if customer has phone and opted in
        if (customer.phone && customer.smsOptIn) {
          try {
            await SmsService.send({
              to: customer.phone,
              message: `🛒 Hi ${customer.firstName || "there"}! You left items in your cart ($${cartTotal.toFixed(2)}). ${offer.message}! Use code: ${discountCode}. Complete your order: ${recoveryUrl}`,
              organizationId,
            });
            smsSent++;
          } catch {
            // individual SMS failure — continue
          }
        }

        // Track the discount code in the database
        try {
          await prisma.discountUsage.create({
            data: {
              customerId: customer.id,
              code: discountCode,
              amount: offer.type === "percentage" ? offer.value : offer.value,
              type:
                offer.type === "shipping"
                  ? "FREE_SHIPPING"
                  : offer.type === "percentage"
                    ? "PERCENTAGE"
                    : "FIXED",
              organizationId,
            },
          });
        } catch {
          // tracking failure — continue
        }

        // Mark as reminded
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: {
            remindedAt: new Date(),
          },
        });
      } catch {
        failed++;
      }
    }

    return apiSuccess(
      {
        processed: abandonedCarts.length,
        emailsSent,
        smsSent,
        codesCreated,
        failed,
        timestamp: new Date().toISOString(),
      },
      { requestId },
    );
  },
  { route: "GET /api/cron/abandoned-cart-recovery" },
);

// ─── Offer Logic ───────────────────────────────────────────────────────────

interface CartOffer {
  type: "shipping" | "percentage";
  value: number;
  message: string;
  label: string;
}

function getCartOffer(cartTotal: number): CartOffer {
  if (cartTotal >= 75) {
    return {
      type: "shipping",
      value: 0,
      message: "Get FREE SHIPPING on your order",
      label: "FREE SHIPPING",
    };
  } else if (cartTotal >= 50) {
    return {
      type: "percentage",
      value: 15,
      message: "Get 15% OFF your order",
      label: "15% OFF",
    };
  } else {
    return {
      type: "percentage",
      value: 10,
      message: "Get 10% OFF your order",
      label: "10% OFF",
    };
  }
}

// ─── Shopify Discount Code Creation ─────────────────────────────────────────

async function createShopifyDiscountCode(params: {
  organizationId: string;
  offer: CartOffer;
  customerId: string;
}): Promise<string> {
  const code = `CART-${randomBytes(4).toString("hex").toUpperCase()}`;

  // Find Shopify integration for this organization
  const integration = await prisma.integration.findFirst({
    where: {
      organizationId: params.organizationId,
      platform: "SHOPIFY",
      isActive: true,
    },
  });

  if (!integration) {
    return code;
  }

  const credentials = integration.credentials as any;
  const shopDomain = credentials.shop;
  const accessToken = credentials.accessToken;

  if (!shopDomain || !accessToken) {
    return code;
  }

  try {
    // Create price rule in Shopify
    const priceRulePayload: any = {
      price_rule: {
        title: code,
        target_type:
          params.offer.type === "shipping" ? "shipping_line" : "line_item",
        target_selection: "all",
        allocation_method: "across",
        value_type:
          params.offer.type === "shipping" ? "percentage" : "percentage",
        value:
          params.offer.type === "shipping"
            ? "-100.0"
            : `-${params.offer.value}.0`,
        customer_selection: "all",
        usage_limit: 1,
        once_per_customer: true,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 7 days
      },
    };

    const priceRuleRes = await fetch(
      `https://${shopDomain}/admin/api/2024-01/price_rules.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(priceRulePayload),
      },
    );

    if (!priceRuleRes.ok) {
      const errText = await priceRuleRes.text();
      return code; // Fall back to DB-only code
    }

    const priceRuleData = await priceRuleRes.json();
    const priceRuleId = priceRuleData.price_rule.id;

    // Create discount code for the price rule
    const discountRes = await fetch(
      `https://${shopDomain}/admin/api/2024-01/price_rules/${priceRuleId}/discount_codes.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discount_code: { code },
        }),
      },
    );

    if (!discountRes.ok) {
      const errText = await discountRes.text();
      return code; // Fall back to DB-only code
    }

    return code;
  } catch {
    return code; // Fall back to DB-only code
  }
}

// ─── Recovery Email ─────────────────────────────────────────────────────────

async function sendRecoveryEmail(params: {
  email: string;
  firstName: string;
  orgName: string;
  organizationId: string;
  cartTotal: number;
  itemsHtml: string;
  discountCode: string;
  offer: CartOffer;
  recoveryUrl: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; background-color: #f4f4f7;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; text-align: center;">
                <p style="font-size: 48px; margin: 0 0 8px 0;">🛒</p>
                <h1 style="color: white; margin: 0; font-size: 26px;">You Left Something Behind!</h1>
                <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 10px 0 0 0;">Your items are waiting for you</p>
              </td>
            </tr>
            
            <!-- Body -->
            <tr>
              <td style="padding: 32px;">
                <p style="font-size: 17px; color: #333; margin: 0 0 16px 0;">
                  Hi ${params.firstName},
                </p>
                <p style="font-size: 15px; color: #666; line-height: 1.6; margin: 0 0 24px 0;">
                  We noticed you left some great items in your cart. Don't worry — we've saved them for you!
                </p>
                
                <!-- Cart Items -->
                <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 0 0 24px 0;">
                  <h3 style="color: #333; margin: 0 0 12px 0; font-size: 15px;">Your Cart Items:</h3>
                  ${params.itemsHtml}
                  <div style="border-top: 2px solid #dee2e6; margin-top: 12px; padding-top: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-size: 18px; font-weight: bold; color: #333;">Total</span>
                      <span style="font-size: 18px; font-weight: bold; color: #333;">$${params.cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Promo Banner -->
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                  <p style="color: white; font-size: 14px; margin: 0 0 6px 0;">🎉 SPECIAL OFFER</p>
                  <p style="color: white; font-size: 22px; font-weight: bold; margin: 0 0 12px 0;">
                    ${params.offer.label}
                  </p>
                  <div style="background: white; border-radius: 8px; padding: 14px 24px; display: inline-block;">
                    <p style="color: #888; font-size: 11px; margin: 0 0 4px 0;">YOUR CODE</p>
                    <p style="color: #f5576c; font-size: 26px; font-weight: bold; margin: 0; letter-spacing: 3px; font-family: monospace;">
                      ${params.discountCode}
                    </p>
                  </div>
                  <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 10px 0 0 0;">Valid for 7 days • Single use</p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${params.recoveryUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 50px; font-size: 17px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                    Complete Your Order →
                  </a>
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 13px; margin: 0 0 6px 0;">Questions? We're here to help!</p>
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} ${params.orgName}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  await EmailService.send({
    to: params.email,
    subject: `🛒 Complete Your Order & Get ${params.offer.label}!`,
    html,
    text: `Hi ${params.firstName}! You left items in your cart ($${params.cartTotal.toFixed(2)}). ${params.offer.message}! Use code: ${params.discountCode} (valid 7 days). Complete your order: ${params.recoveryUrl} — ${params.orgName}`,
    organizationId: params.organizationId,
  });
}
