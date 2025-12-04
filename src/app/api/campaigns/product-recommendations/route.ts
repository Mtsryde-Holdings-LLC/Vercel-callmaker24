import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, productIds } = await req.json();

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { orders: { include: { items: true } } }
    });

    if (!customer || !customer.email) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, organizationId: session.user.organizationId }
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Create a personalized product recommendation email for ${customer.firstName}. 
        Products: ${products.map(p => `${p.name} - ${p.description} - $${p.price}`).join(', ')}
        Customer's past orders: ${customer.orders.length}
        Make it engaging and include product benefits.`
      }],
      temperature: 0.7,
    });

    const emailContent = completion.choices[0]?.message?.content || '';

    const productsHtml = products.map(p => `
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
        ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" style="max-width: 200px; height: auto;">` : ''}
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <p style="font-size: 24px; color: #0ea5e9; font-weight: bold;">$${p.price}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/products/${p.id}" 
           style="background: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Shop Now
        </a>
      </div>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Hi ${customer.firstName}!</h1>
        ${emailContent}
        <div style="margin-top: 30px;">
          ${productsHtml}
        </div>
      </div>
    `;

    await EmailService.send({
      to: customer.email,
      subject: `${customer.firstName}, check out these products we picked for you!`,
      html,
      organizationId: session.user.organizationId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, sent: 1 });
  } catch (error: any) {
    console.error('Product recommendation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
