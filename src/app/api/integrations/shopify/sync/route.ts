import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.text();
    if (!body) {
      return NextResponse.json({ error: 'No body provided' }, { status: 400 });
    }
    const { organizationId, shop, accessToken } = JSON.parse(body);
    console.log('Sync started:', { organizationId, shop });

    // Sync customers
    const customersResponse = await fetch(`https://${shop}/admin/api/2024-01/customers.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const customersData = await customersResponse.json();
    console.log('Shopify response:', customersData);
    const { customers } = customersData;

    let syncedCustomers = 0;
    console.log('Total customers from Shopify:', customers?.length);
    for (const customer of customers || []) {
      try {
        if (!customer.email) {
          console.log('Skipping customer without email:', customer.id);
          continue;
        }
        console.log('Syncing customer:', customer.email);
        
        await prisma.customer.upsert({
          where: {
            email_organizationId: {
              email: customer.email,
              organizationId,
            },
          },
          create: {
            email: customer.email,
            firstName: customer.first_name || 'Unknown',
            lastName: customer.last_name || '',
            phone: customer.phone,
            organizationId,
            createdById: session.user.id,
          },
          update: {
            firstName: customer.first_name || 'Unknown',
            lastName: customer.last_name || '',
            phone: customer.phone,
          },
        });
        syncedCustomers++;
      } catch (err: any) {
        console.error('Customer sync error:', err.message, customer);
      }
    }

    // Products and orders sync disabled (models not in schema)
    const products = [];
    const orders = [];

    return NextResponse.json({ 
      success: true, 
      synced: { 
        customers: syncedCustomers, 
        products: 0,
        orders: 0,
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
