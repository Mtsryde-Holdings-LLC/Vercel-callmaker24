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

    // Sync customers with pagination (batch of 500 max to avoid timeout)
    let syncedCustomers = 0;
    let pageInfo = null;
    let pageCount = 0;
    const maxPages = 2; // Sync 500 customers per request (2 pages x 250)
    
    while (pageCount < maxPages) {
      const url = pageInfo 
        ? `https://${shop}/admin/api/2024-01/customers.json?limit=250&page_info=${pageInfo}`
        : `https://${shop}/admin/api/2024-01/customers.json?limit=250`;
        
      const customersResponse = await fetch(url, {
        headers: { 'X-Shopify-Access-Token': accessToken },
      });
      
      const customersData = await customersResponse.json();
      const { customers } = customersData;
      
      console.log(`Page ${pageCount + 1}: Fetched ${customers?.length || 0} customers`);
      
      if (!customers || customers.length === 0) break;

      for (const customer of customers) {
        try {
          await prisma.customer.upsert({
            where: {
              shopifyId_organizationId: {
                shopifyId: customer.id.toString(),
                organizationId,
              },
            },
            create: {
              shopifyId: customer.id.toString(),
              email: customer.email || null,
              firstName: customer.first_name || 'Unknown',
              lastName: customer.last_name || '',
              phone: customer.phone,
              organizationId,
              createdById: session.user.id,
            },
            update: {
              email: customer.email || null,
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

      // Get next page info from Link header
      const linkHeader = customersResponse.headers.get('Link');
      const nextMatch = linkHeader?.match(/<[^>]*[?&]page_info=([^>&]+)[^>]*>; rel="next"/);
      pageInfo = nextMatch?.[1] || null;
      
      console.log('Next page_info:', pageInfo);
      
      if (!pageInfo) break;
      pageCount++;
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
