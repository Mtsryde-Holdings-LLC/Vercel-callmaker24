import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Verify Shopify webhook signature
function verifyShopifyWebhook(body: string, hmacHeader: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  
  return hash === hmacHeader;
}

export async function POST(request: NextRequest) {
  try {
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
    const shopDomain = request.headers.get('x-shopify-shop-domain');
    const topic = request.headers.get('x-shopify-topic');
    
    const body = await request.text();
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || 'your-webhook-secret';

    // Verify webhook authenticity
    if (hmacHeader && !verifyShopifyWebhook(body, hmacHeader, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const customerData = JSON.parse(body);

    console.log(`Received Shopify webhook: ${topic} from ${shopDomain}`);

    // Process based on webhook topic
    switch (topic) {
      case 'customers/create':
        await handleCustomerCreate(customerData, shopDomain);
        break;
      
      case 'customers/update':
        await handleCustomerUpdate(customerData, shopDomain);
        break;
      
      case 'customers/delete':
        await handleCustomerDelete(customerData, shopDomain);
        break;
      
      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    return NextResponse.json({ success: true, topic });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCustomerCreate(customer: any, shopDomain: string | null) {
  try {
    // Transform Shopify customer data to our format
    const customerData = {
      id: `shopify_${customer.id}`,
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      tags: customer.tags ? customer.tags.split(',').map((t: string) => t.trim()) : [],
      acceptsMarketing: customer.accepts_marketing || false,
      ordersCount: customer.orders_count || 0,
      totalSpent: customer.total_spent || '0.00',
      source: `Shopify - ${shopDomain}`,
      shopifyId: customer.id,
      shopDomain: shopDomain,
      createdAt: customer.created_at || new Date().toISOString(),
    };

    // Save to database (replace with actual database call)
    console.log('Creating customer from webhook:', customerData);
    
    // Example: await prisma.customer.create({ data: customerData });
    // For now, we'll call our existing API
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    });

    console.log(`Customer created: ${customer.email}`);
  } catch (error) {
    console.error('Error creating customer:', error);
  }
}

async function handleCustomerUpdate(customer: any, shopDomain: string | null) {
  try {
    const customerData = {
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      tags: customer.tags ? customer.tags.split(',').map((t: string) => t.trim()) : [],
      acceptsMarketing: customer.accepts_marketing || false,
      ordersCount: customer.orders_count || 0,
      totalSpent: customer.total_spent || '0.00',
      updatedAt: new Date().toISOString(),
    };

    // Update in database (replace with actual database call)
    console.log('Updating customer from webhook:', customerData);
    
    // Example: await prisma.customer.update({
    //   where: { shopifyId: customer.id },
    //   data: customerData
    // });

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/customers/shopify_${customer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    });

    console.log(`Customer updated: ${customer.email}`);
  } catch (error) {
    console.error('Error updating customer:', error);
  }
}

async function handleCustomerDelete(customer: any, shopDomain: string | null) {
  try {
    // Delete from database (replace with actual database call)
    console.log('Deleting customer from webhook:', customer.id);
    
    // Example: await prisma.customer.delete({
    //   where: { shopifyId: customer.id }
    // });

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/customers/shopify_${customer.id}`, {
      method: 'DELETE',
    });

    console.log(`Customer deleted: ${customer.id}`);
  } catch (error) {
    console.error('Error deleting customer:', error);
  }
}
