import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(body, 'utf8')
    .digest('base64');
  return hash === hmac;
}

export async function POST(req: NextRequest) {
  try {
    const hmac = req.headers.get('x-shopify-hmac-sha256');
    const shop = req.headers.get('x-shopify-shop-domain');
    const body = await req.text();

    if (!hmac || !verifyShopifyWebhook(body, hmac)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const order = JSON.parse(body);

    const integration = await prisma.integration.findFirst({
      where: { 
        platform: 'SHOPIFY',
        credentials: { path: ['shop'], equals: shop }
      }
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    let customer = await prisma.customer.findFirst({
      where: { email: order.email, organizationId: integration.organizationId }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: order.email,
          firstName: order.customer?.first_name,
          lastName: order.customer?.last_name,
          phone: order.customer?.phone,
          organizationId: integration.organizationId,
          source: 'SHOPIFY',
          externalId: order.customer?.id?.toString(),
        }
      });
    }

    await prisma.order.upsert({
      where: {
        externalId_organizationId: {
          externalId: order.id.toString(),
          organizationId: integration.organizationId,
        }
      },
      create: {
        customerId: customer.id,
        externalId: order.id.toString(),
        orderNumber: order.order_number.toString(),
        totalAmount: parseFloat(order.total_price),
        status: order.financial_status,
        organizationId: integration.organizationId,
        source: 'SHOPIFY',
        orderDate: new Date(order.created_at),
      },
      update: {
        totalAmount: parseFloat(order.total_price),
        status: order.financial_status,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Shopify order webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
