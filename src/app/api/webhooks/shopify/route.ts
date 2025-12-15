import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Verify Shopify webhook signature using timing-safe comparison
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Shopify Customer Webhook] SHOPIFY_WEBHOOK_SECRET not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
    const shopDomain = request.headers.get('x-shopify-shop-domain');
    const topic = request.headers.get('x-shopify-topic');

    const body = await request.text();

    // Verify webhook authenticity
    if (!hmacHeader || !verifyShopifyWebhook(body, hmacHeader)) {
      console.error('[Shopify Customer Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const customerData = JSON.parse(body);

    console.log(`[Shopify Customer Webhook] Received ${topic} from ${shopDomain}`);

    // Find the integration for this shop
    const integration = await prisma.integration.findFirst({
      where: {
        platform: 'SHOPIFY',
        credentials: { path: ['shop'], equals: shopDomain },
      },
    });

    if (!integration) {
      console.error('[Shopify Customer Webhook] Integration not found for shop:', shopDomain);
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Process based on webhook topic
    switch (topic) {
      case 'customers/create':
        await handleCustomerCreate(customerData, integration.organizationId, shopDomain);
        break;

      case 'customers/update':
        await handleCustomerUpdate(customerData, integration.organizationId);
        break;

      case 'customers/delete':
        await handleCustomerDelete(customerData, integration.organizationId);
        break;

      default:
        console.log(`[Shopify Customer Webhook] Unhandled topic: ${topic}`);
    }

    return NextResponse.json({ success: true, topic });
  } catch (error: any) {
    console.error('[Shopify Customer Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCustomerCreate(customer: any, organizationId: string, shopDomain: string | null) {
  try {
    // Check if customer already exists (idempotency)
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { shopifyId: customer.id?.toString(), organizationId },
          { email: customer.email, organizationId },
        ],
      },
    });

    if (existingCustomer) {
      console.log(`[Shopify Customer Webhook] Customer already exists: ${existingCustomer.id}`);
      // Update instead of create
      await handleCustomerUpdate(customer, organizationId);
      return;
    }

    // Build address string from default_address
    const defaultAddress = customer.default_address;
    const addressString = defaultAddress
      ? [
          defaultAddress.address1,
          defaultAddress.address2,
          defaultAddress.city,
          defaultAddress.province,
          defaultAddress.zip,
          defaultAddress.country,
        ]
          .filter(Boolean)
          .join(', ')
      : null;

    const newCustomer = await prisma.customer.create({
      data: {
        email: customer.email,
        firstName: customer.first_name || 'Unknown',
        lastName: customer.last_name || '',
        phone: customer.phone || defaultAddress?.phone,
        shopifyId: customer.id?.toString(),
        externalId: customer.id?.toString(),
        organizationId,
        source: 'SHOPIFY',
        emailOptIn: customer.accepts_marketing ?? true,
        smsOptIn: customer.sms_marketing_consent?.state === 'subscribed',
        totalSpent: parseFloat(customer.total_spent || '0'),
        orderCount: customer.orders_count || 0,
        address: addressString,
        company: defaultAddress?.company,
        notes: shopDomain ? `Imported from Shopify: ${shopDomain}` : undefined,
      },
    });

    console.log(`[Shopify Customer Webhook] Customer created: ${newCustomer.id} (${customer.email})`);
  } catch (error: any) {
    // Handle unique constraint violations gracefully
    if (error.code === 'P2002') {
      console.log(`[Shopify Customer Webhook] Customer already exists, skipping create`);
      return;
    }
    console.error('[Shopify Customer Webhook] Error creating customer:', error);
    throw error;
  }
}

async function handleCustomerUpdate(customer: any, organizationId: string) {
  try {
    // Find customer by Shopify ID or email
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { shopifyId: customer.id?.toString(), organizationId },
          { email: customer.email, organizationId },
        ],
      },
    });

    if (!existingCustomer) {
      console.log(`[Shopify Customer Webhook] Customer not found for update, creating new: ${customer.email}`);
      // Create the customer if they don't exist
      await handleCustomerCreate(customer, organizationId, null);
      return;
    }

    // Build address string from default_address
    const defaultAddress = customer.default_address;
    const addressString = defaultAddress
      ? [
          defaultAddress.address1,
          defaultAddress.address2,
          defaultAddress.city,
          defaultAddress.province,
          defaultAddress.zip,
          defaultAddress.country,
        ]
          .filter(Boolean)
          .join(', ')
      : null;

    const updatedCustomer = await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: {
        email: customer.email || existingCustomer.email,
        firstName: customer.first_name || existingCustomer.firstName,
        lastName: customer.last_name || existingCustomer.lastName,
        phone: customer.phone || defaultAddress?.phone || existingCustomer.phone,
        shopifyId: customer.id?.toString(),
        emailOptIn: customer.accepts_marketing ?? existingCustomer.emailOptIn,
        smsOptIn: customer.sms_marketing_consent?.state === 'subscribed' || existingCustomer.smsOptIn,
        totalSpent: parseFloat(customer.total_spent || '0') || existingCustomer.totalSpent,
        orderCount: customer.orders_count ?? existingCustomer.orderCount,
        address: addressString || existingCustomer.address,
        company: defaultAddress?.company || existingCustomer.company,
      },
    });

    console.log(`[Shopify Customer Webhook] Customer updated: ${updatedCustomer.id}`);
  } catch (error) {
    console.error('[Shopify Customer Webhook] Error updating customer:', error);
    throw error;
  }
}

async function handleCustomerDelete(customer: any, organizationId: string) {
  try {
    // Find and soft-delete or hard-delete the customer
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        shopifyId: customer.id?.toString(),
        organizationId,
      },
    });

    if (!existingCustomer) {
      console.log(`[Shopify Customer Webhook] Customer not found for deletion: ${customer.id}`);
      return;
    }

    // Option 1: Soft delete (recommended) - mark as deleted
    await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: {
        deletedAt: new Date(),
        shopifyId: null, // Clear Shopify ID to allow re-import if needed
      },
    });

    console.log(`[Shopify Customer Webhook] Customer soft-deleted: ${existingCustomer.id}`);
  } catch (error) {
    console.error('[Shopify Customer Webhook] Error deleting customer:', error);
    throw error;
  }
}
