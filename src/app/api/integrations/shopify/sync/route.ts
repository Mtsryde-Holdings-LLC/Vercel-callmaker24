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

    // Sync customers with pagination
    let syncedCustomers = 0;
    let nextPageUrl = `https://${shop}/admin/api/2024-01/customers.json?limit=250`;
    
    while (nextPageUrl) {
      const customersResponse = await fetch(nextPageUrl, {
        headers: { 'X-Shopify-Access-Token': accessToken },
      });
      const customersData = await customersResponse.json();
      const { customers } = customersData;

      for (const customer of customers || []) {
        try {
          if (!customer.email) continue;
          
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
          console.error('Customer sync error:', err.message);
        }
      }

      // Get next page URL from Link header
      const linkHeader = customersResponse.headers.get('Link');
      nextPageUrl = linkHeader?.match(/<([^>]+)>; rel="next"/)?.[1] || null;
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
