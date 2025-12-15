import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WebhookLogger } from '@/lib/webhook-logger';
import crypto from 'crypto';

// Verify Shopify webhook signature
function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Shopify Refunds Webhook] SHOPIFY_WEBHOOK_SECRET not configured');
    return false;
  }
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let webhookLog: { id: string; startTime: number } | null = null;

  try {
    const hmac = req.headers.get('x-shopify-hmac-sha256');
    const shop = req.headers.get('x-shopify-shop-domain');
    const topic = req.headers.get('x-shopify-topic');
    const body = await req.text();

    const refund = JSON.parse(body);

    // Log webhook received
    webhookLog = await WebhookLogger.logReceived({
      platform: 'SHOPIFY',
      topic: topic || 'refunds/unknown',
      shopDomain: shop,
      externalId: refund.id?.toString(),
      headers: { topic: topic || '', shop: shop || '' },
    });

    if (!hmac || !verifyShopifyWebhook(body, hmac)) {
      console.error('[Shopify Refunds Webhook] Invalid signature');
      await WebhookLogger.logFailure(webhookLog.id, webhookLog.startTime, 'Invalid signature', '401');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log(`[Shopify Refunds Webhook] Received ${topic} from ${shop}`);

    await WebhookLogger.logProcessing(webhookLog.id);

    // Find the integration for this shop
    const integration = await prisma.integration.findFirst({
      where: {
        platform: 'SHOPIFY',
        credentials: { path: ['shop'], equals: shop },
      },
    });

    if (!integration) {
      console.error('[Shopify Refunds Webhook] Integration not found for shop:', shop);
      await WebhookLogger.logFailure(webhookLog.id, webhookLog.startTime, 'Integration not found', '404');
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Process refund
    await handleRefundCreate(refund, integration.organizationId);

    // Log successful processing
    await WebhookLogger.logSuccess(webhookLog.id, webhookLog.startTime, integration.organizationId);

    return NextResponse.json({ success: true, topic });
  } catch (error: any) {
    console.error('[Shopify Refunds Webhook] Error:', error);

    if (webhookLog) {
      await WebhookLogger.logFailure(webhookLog.id, webhookLog.startTime, error, '500');
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleRefundCreate(refund: any, organizationId: string) {
  try {
    const orderId = refund.order_id?.toString();

    if (!orderId) {
      console.log('[Shopify Refunds Webhook] No order_id in refund, skipping');
      return;
    }

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { externalId: orderId, organizationId },
          { shopifyOrderId: orderId, organizationId },
        ],
      },
      include: { customer: true },
    });

    if (!order) {
      console.log(`[Shopify Refunds Webhook] Order not found: ${orderId}`);
      return;
    }

    // Calculate total refund amount
    const refundAmount = refund.transactions?.reduce((sum: number, tx: any) => {
      return sum + parseFloat(tx.amount || '0');
    }, 0) || 0;

    // Determine if fully or partially refunded
    const isFullRefund = refundAmount >= (order.total || order.totalAmount || 0);
    const newStatus = isFullRefund ? 'refunded' : order.status;
    const newFinancialStatus = isFullRefund ? 'refunded' : 'partially_refunded';

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        financialStatus: newFinancialStatus,
      },
    });

    console.log(
      `[Shopify Refunds Webhook] Order ${order.id} updated - refund: $${refundAmount}, status: ${newFinancialStatus}`
    );

    // Update customer total spent (subtract refund amount)
    if (order.customer && refundAmount > 0) {
      const newTotalSpent = Math.max(0, (order.customer.totalSpent || 0) - refundAmount);
      await prisma.customer.update({
        where: { id: order.customer.id },
        data: { totalSpent: newTotalSpent },
      });
      console.log(
        `[Shopify Refunds Webhook] Customer ${order.customer.id} totalSpent updated to $${newTotalSpent}`
      );
    }
  } catch (error) {
    console.error('[Shopify Refunds Webhook] Error processing refund:', error);
    throw error;
  }
}
