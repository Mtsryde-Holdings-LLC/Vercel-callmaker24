import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';
import { SmsService } from '@/services/sms.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const checkout = JSON.parse(body);

    const integration = await prisma.integration.findFirst({
      where: { 
        platform: 'SHOPIFY',
        credentials: { path: ['shop'], equals: req.headers.get('x-shopify-shop-domain') }
      }
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const customer = await prisma.customer.findFirst({
      where: { email: checkout.email, organizationId: integration.organizationId }
    });

    if (!customer) {
      return NextResponse.json({ success: true });
    }

    // Create abandoned cart record
    await prisma.abandonedCart.create({
      data: {
        customerId: customer.id,
        organizationId: integration.organizationId,
        cartValue: parseFloat(checkout.total_price),
        cartUrl: checkout.abandoned_checkout_url,
        items: checkout.line_items,
        externalId: checkout.id.toString(),
      }
    });

    // Send recovery email after 1 hour
    setTimeout(async () => {
      const products = checkout.line_items.map((item: any) => 
        `${item.title} - $${item.price}`
      ).join('\n');

      await EmailService.send({
        to: customer.email!,
        subject: 'You left items in your cart!',
        html: `
          <h2>Complete your purchase</h2>
          <p>Hi ${customer.firstName},</p>
          <p>You left these items in your cart:</p>
          <p>${products}</p>
          <p><a href="${checkout.abandoned_checkout_url}">Complete your order now</a></p>
        `,
        organizationId: integration.organizationId,
      });

      if (customer.phone && customer.smsOptIn) {
        await SmsService.send({
          to: customer.phone,
          message: `Hi ${customer.firstName}! You left items in your cart. Complete your order: ${checkout.abandoned_checkout_url}`,
          organizationId: integration.organizationId,
        });
      }
    }, 3600000); // 1 hour

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Abandoned cart webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
