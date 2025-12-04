import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { organizationId, shop, accessToken } = await req.json();

    // Sync customers
    const customersResponse = await fetch(`https://${shop}/admin/api/2024-01/customers.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const { customers } = await customersResponse.json();

    for (const customer of customers || []) {
      await prisma.customer.upsert({
        where: {
          email_organizationId: {
            email: customer.email,
            organizationId,
          },
        },
        create: {
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          organizationId,
          source: 'SHOPIFY',
          externalId: customer.id.toString(),
        },
        update: {
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
        },
      });
    }

    // Sync products
    const productsResponse = await fetch(`https://${shop}/admin/api/2024-01/products.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const { products } = await productsResponse.json();

    for (const product of products || []) {
      await prisma.product.upsert({
        where: {
          externalId_organizationId: {
            externalId: product.id.toString(),
            organizationId,
          },
        },
        create: {
          name: product.title,
          description: product.body_html,
          price: parseFloat(product.variants[0]?.price || '0'),
          imageUrl: product.image?.src,
          externalId: product.id.toString(),
          organizationId,
          source: 'SHOPIFY',
        },
        update: {
          name: product.title,
          description: product.body_html,
          price: parseFloat(product.variants[0]?.price || '0'),
          imageUrl: product.image?.src,
        },
      });
    }

    // Sync orders
    const ordersResponse = await fetch(`https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const { orders } = await ordersResponse.json();

    for (const order of orders || []) {
      const customer = await prisma.customer.findFirst({
        where: { email: order.email, organizationId },
      });

      if (customer) {
        await prisma.order.upsert({
          where: {
            externalId_organizationId: {
              externalId: order.id.toString(),
              organizationId,
            },
          },
          create: {
            customerId: customer.id,
            externalId: order.id.toString(),
            orderNumber: order.order_number.toString(),
            totalAmount: parseFloat(order.total_price),
            status: order.financial_status,
            organizationId,
            source: 'SHOPIFY',
            orderDate: new Date(order.created_at),
          },
          update: {
            totalAmount: parseFloat(order.total_price),
            status: order.financial_status,
          },
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      synced: { 
        customers: customers?.length || 0, 
        products: products?.length || 0,
        orders: orders?.length || 0,
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
