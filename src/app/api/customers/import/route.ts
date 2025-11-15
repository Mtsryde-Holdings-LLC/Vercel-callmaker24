import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const customers = [];
    let imported = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',').map(v => v.trim());
      const customer: any = {};

      headers.forEach((header, index) => {
        customer[header] = values[index] || '';
      });

      // Validate required fields
      if (customer.email && customer.firstName) {
        customers.push({
          id: `imported_${Date.now()}_${i}`,
          firstName: customer.firstName,
          lastName: customer.lastName || '',
          email: customer.email,
          phone: customer.phone || '',
          tags: customer.tags ? customer.tags.split(';') : [],
          acceptsMarketing: customer.acceptsMarketing === 'true' || customer.acceptsMarketing === '1',
          source: 'CSV Import',
          importedAt: new Date().toISOString(),
        });
        imported++;
      } else {
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
      total: lines.length - 1,
      customers,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import customers' },
      { status: 500 }
    );
  }
}
