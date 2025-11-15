import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Mock customer data - replace with actual database query
    const customers = [
      {
        id: 'cust_001',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0101',
        tags: 'VIP;Newsletter',
        acceptsMarketing: true,
        createdAt: '2024-01-15',
      },
      {
        id: 'cust_002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@example.com',
        phone: '+1-555-0102',
        tags: 'Repeat Customer',
        acceptsMarketing: true,
        createdAt: '2024-02-20',
      },
    ];

    if (format === 'csv') {
      const headers = ['id', 'firstName', 'lastName', 'email', 'phone', 'tags', 'acceptsMarketing', 'createdAt'];
      const csvRows = [headers.join(',')];

      customers.forEach(customer => {
        const row = headers.map(header => {
          const value = customer[header as keyof typeof customer];
          return `"${value}"`;
        });
        csvRows.push(row.join(','));
      });

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="customers_${Date.now()}.csv"`,
        },
      });
    }

    // JSON format
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export customers' },
      { status: 500 }
    );
  }
}
