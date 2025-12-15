import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';
import { SmsService } from '@/services/sms.service';

// Set max duration for Vercel serverless function
export const maxDuration = 60; // 60 seconds

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  // Allow if no secret is configured (development)
  if (!cronSecret) {
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify request is from Vercel cron or authorized caller
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Abandoned Cart Recovery] Starting cron job...');

    const now = new Date();
    const stats = {
      processed: 0,
      emailsSent: 0,
      smsSent: 0,
      errors: 0,
      skipped: 0,
    };

    // Find all pending carts scheduled for recovery
    const pendingCarts = await prisma.abandonedCart.findMany({
      where: {
        status: 'PENDING',
        recovered: false,
        recoveryScheduledAt: {
          lte: now, // Scheduled time has passed
        },
      },
      include: {
        customer: true,
      },
      take: 50, // Process in batches to avoid timeout
    });

    console.log(`[Abandoned Cart Recovery] Found ${pendingCarts.length} carts to process`);

    for (const cart of pendingCarts) {
      try {
        stats.processed++;

        // Skip if customer doesn't have email
        if (!cart.customer?.email) {
          console.log(`[Abandoned Cart Recovery] Skipping cart ${cart.id} - no customer email`);
          stats.skipped++;
          continue;
        }

        // Check if cart was recovered (completed checkout)
        // This could be enhanced to check Shopify API for checkout status
        if (cart.recovered) {
          await prisma.abandonedCart.update({
            where: { id: cart.id },
            data: { status: 'RECOVERED' },
          });
          stats.skipped++;
          continue;
        }

        // Format cart items for email
        const items = Array.isArray(cart.items) ? cart.items : [];
        const products = items
          .map((item: any) => `• ${item.title || item.name} - $${item.price || '0.00'}`)
          .join('\n');

        const htmlProducts = items
          .map((item: any) =>
            `<li style="margin-bottom: 8px;">${item.title || item.name} - <strong>$${item.price || '0.00'}</strong></li>`
          )
          .join('');

        // Send recovery email
        try {
          await EmailService.send({
            to: cart.customer.email,
            subject: "You left items in your cart! Complete your purchase",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Don't forget your items!</h2>
                <p>Hi ${cart.customer.firstName || 'there'},</p>
                <p>We noticed you left some items in your cart. They're still waiting for you:</p>
                <ul style="background: #f9f9f9; padding: 20px 40px; border-radius: 8px;">
                  ${htmlProducts}
                </ul>
                <p style="font-size: 18px;"><strong>Cart Total: $${cart.total.toFixed(2)}</strong></p>
                ${cart.cartUrl ? `
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${cart.cartUrl}"
                     style="background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Complete Your Purchase
                  </a>
                </p>
                ` : ''}
                <p style="color: #666; font-size: 14px;">
                  If you have any questions, just reply to this email. We're here to help!
                </p>
              </div>
            `,
            organizationId: cart.organizationId || undefined,
          });
          stats.emailsSent++;
        } catch (emailError) {
          console.error(`[Abandoned Cart Recovery] Email failed for cart ${cart.id}:`, emailError);
          stats.errors++;
        }

        // Send SMS if customer opted in and has phone
        if (cart.customer.phone && cart.customer.smsOptIn) {
          try {
            const smsMessage = cart.cartUrl
              ? `Hi ${cart.customer.firstName || 'there'}! You left items ($${cart.total.toFixed(2)}) in your cart. Complete your order: ${cart.cartUrl}`
              : `Hi ${cart.customer.firstName || 'there'}! You left items ($${cart.total.toFixed(2)}) in your cart. Visit our store to complete your purchase!`;

            await SmsService.send({
              to: cart.customer.phone,
              message: smsMessage,
              organizationId: cart.organizationId || undefined,
            });
            stats.smsSent++;
          } catch (smsError) {
            console.error(`[Abandoned Cart Recovery] SMS failed for cart ${cart.id}:`, smsError);
            // Don't count SMS failures as errors since email is primary
          }
        }

        // Update cart status
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: {
            status: 'SENT',
            recoverySentAt: new Date(),
          },
        });

      } catch (cartError) {
        console.error(`[Abandoned Cart Recovery] Error processing cart ${cart.id}:`, cartError);
        stats.errors++;

        // Mark as failed after error
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { status: 'PENDING' }, // Keep pending to retry next cron run
        }).catch(() => {}); // Ignore update errors
      }
    }

    // Expire old carts that haven't been recovered (older than 7 days)
    const expiredCount = await prisma.abandonedCart.updateMany({
      where: {
        status: 'SENT',
        recovered: false,
        recoverySentAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    console.log(`[Abandoned Cart Recovery] Completed. Stats:`, {
      ...stats,
      expired: expiredCount.count,
    });

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        expired: expiredCount.count,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Abandoned Cart Recovery] Cron job failed:', error);
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}
