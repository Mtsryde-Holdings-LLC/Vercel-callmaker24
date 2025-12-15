import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Verify Shopify webhook signature
function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Shopify Cart Webhook] SHOPIFY_WEBHOOK_SECRET not configured');
    return false;
  }
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
}

export async function POST(req: NextRequest) {
  try {
    const hmac = req.headers.get('x-shopify-hmac-sha256');
    const shop = req.headers.get('x-shopify-shop-domain');
    const topic = req.headers.get('x-shopify-topic');
    const body = await req.text();

    // Verify webhook signature
    if (!hmac || !verifyShopifyWebhook(body, hmac)) {
      console.error('[Shopify Cart Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log(`[Shopify Cart Webhook] Received ${topic} from ${shop}`);

    const checkout = JSON.parse(body);

    const integration = await prisma.integration.findFirst({
      where: {
        platform: 'SHOPIFY',
        credentials: { path: ['shop'], equals: shop }
      }
    });

    if (!integration) {
      console.error('[Shopify Cart Webhook] Integration not found for shop:', shop);
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const customer = await prisma.customer.findFirst({
      where: { email: checkout.email, organizationId: integration.organizationId }
    });

    if (!customer) {
      return NextResponse.json({ success: true });
    }

    // Use upsert for idempotency - prevents duplicate processing
    const abandonedCart = await prisma.abandonedCart.upsert({
      where: {
        externalId_organizationId: {
          externalId: checkout.id.toString(),
          organizationId: integration.organizationId,
        }
      },
      create: {
        customerId: customer.id,
        organizationId: integration.organizationId,
        total: parseFloat(checkout.total_price || '0'),
        cartUrl: checkout.abandoned_checkout_url,
        items: checkout.line_items || [],
        externalId: checkout.id.toString(),
        shopifyCartId: checkout.token || checkout.id.toString(),
        // Schedule recovery email for 1 hour from now
        recoveryScheduledAt: new Date(Date.now() + 60 * 60 * 1000),
        status: 'PENDING',
      },
      update: {
        total: parseFloat(checkout.total_price || '0'),
        cartUrl: checkout.abandoned_checkout_url,
        items: checkout.line_items || [],
      }
    });

    console.log(`[Shopify Cart Webhook] Abandoned cart ${abandonedCart.id} processed for customer ${customer.id}`);

    // NOTE: Recovery emails are now processed by a cron job at /api/cron/abandoned-cart-recovery
    // This ensures emails are not lost on server restarts and provides better reliability

    return NextResponse.json({
      success: true,
      cartId: abandonedCart.id,
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error('[Shopify Cart Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
