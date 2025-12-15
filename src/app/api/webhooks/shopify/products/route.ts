import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WebhookLogger } from '@/lib/webhook-logger';
import crypto from 'crypto';

// Verify Shopify webhook signature
function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Shopify Products Webhook] SHOPIFY_WEBHOOK_SECRET not configured');
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

    const product = JSON.parse(body);

    // Log webhook received
    webhookLog = await WebhookLogger.logReceived({
      platform: 'SHOPIFY',
      topic: topic || 'products/unknown',
      shopDomain: shop,
      externalId: product.id?.toString(),
      headers: { topic: topic || '', shop: shop || '' },
    });

    if (!hmac || !verifyShopifyWebhook(body, hmac)) {
      console.error('[Shopify Products Webhook] Invalid signature');
      await WebhookLogger.logFailure(webhookLog.id, webhookLog.startTime, 'Invalid signature', '401');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log(`[Shopify Products Webhook] Received ${topic} from ${shop}`);

    await WebhookLogger.logProcessing(webhookLog.id);

    // Find the integration for this shop
    const integration = await prisma.integration.findFirst({
      where: {
        platform: 'SHOPIFY',
        credentials: { path: ['shop'], equals: shop },
      },
    });

    if (!integration) {
      console.error('[Shopify Products Webhook] Integration not found for shop:', shop);
      await WebhookLogger.logFailure(webhookLog.id, webhookLog.startTime, 'Integration not found', '404');
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Process based on webhook topic
    switch (topic) {
      case 'products/create':
      case 'products/update':
        await handleProductUpsert(product, integration.organizationId);
        break;

      case 'products/delete':
        await handleProductDelete(product, integration.organizationId);
        break;

      default:
        console.log(`[Shopify Products Webhook] Unhandled topic: ${topic}`);
    }

    // Log successful processing
    await WebhookLogger.logSuccess(webhookLog.id, webhookLog.startTime, integration.organizationId);

    return NextResponse.json({ success: true, topic });
  } catch (error: any) {
    console.error('[Shopify Products Webhook] Error:', error);

    if (webhookLog) {
      await WebhookLogger.logFailure(webhookLog.id, webhookLog.startTime, error, '500');
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleProductUpsert(product: any, organizationId: string) {
  try {
    // Extract first variant for base pricing
    const firstVariant = product.variants?.[0];

    // Extract image URLs
    const images = product.images?.map((img: any) => img.src) || [];

    const productData = {
      title: product.title,
      description: product.body_html || null,
      handle: product.handle,
      vendor: product.vendor,
      productType: product.product_type,
      tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
      price: firstVariant ? parseFloat(firstVariant.price || '0') : null,
      compareAtPrice: firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
      inventoryQuantity: firstVariant?.inventory_quantity || 0,
      inventoryPolicy: firstVariant?.inventory_policy,
      imageUrl: product.image?.src || images[0] || null,
      images: images.length > 0 ? images : null,
      variants: product.variants || null,
      status: product.status === 'active' ? 'ACTIVE' : product.status === 'draft' ? 'DRAFT' : 'ARCHIVED',
      publishedAt: product.published_at ? new Date(product.published_at) : null,
    };

    const upsertedProduct = await prisma.product.upsert({
      where: {
        shopifyId_organizationId: {
          shopifyId: product.id.toString(),
          organizationId,
        },
      },
      create: {
        shopifyId: product.id.toString(),
        externalId: product.id.toString(),
        organizationId,
        ...productData,
      },
      update: productData,
    });

    console.log(`[Shopify Products Webhook] Product upserted: ${upsertedProduct.id} (${product.title})`);
  } catch (error) {
    console.error('[Shopify Products Webhook] Error upserting product:', error);
    throw error;
  }
}

async function handleProductDelete(product: any, organizationId: string) {
  try {
    // Soft delete by changing status to ARCHIVED
    const existingProduct = await prisma.product.findFirst({
      where: {
        shopifyId: product.id.toString(),
        organizationId,
      },
    });

    if (!existingProduct) {
      console.log(`[Shopify Products Webhook] Product not found for deletion: ${product.id}`);
      return;
    }

    await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        status: 'ARCHIVED',
        shopifyId: null, // Clear to allow re-import if needed
      },
    });

    console.log(`[Shopify Products Webhook] Product archived: ${existingProduct.id}`);
  } catch (error) {
    console.error('[Shopify Products Webhook] Error deleting product:', error);
    throw error;
  }
}
