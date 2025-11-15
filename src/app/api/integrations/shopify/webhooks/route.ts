import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { store, apiKey, apiVersion = '2024-01' } = await request.json();

    if (!store || !apiKey) {
      return NextResponse.json(
        { error: 'Store URL and API key are required' },
        { status: 400 }
      );
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/webhooks/shopify`;
    const webhooks = [
      {
        topic: 'customers/create',
        address: webhookUrl,
        format: 'json',
      },
      {
        topic: 'customers/update',
        address: webhookUrl,
        format: 'json',
      },
      {
        topic: 'customers/delete',
        address: webhookUrl,
        format: 'json',
      },
    ];

    const registeredWebhooks = [];
    const errors = [];

    // Register each webhook with Shopify
    for (const webhook of webhooks) {
      try {
        // In production, use actual Shopify Admin API
        // const response = await fetch(
        //   `https://${store}/admin/api/${apiVersion}/webhooks.json`,
        //   {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'X-Shopify-Access-Token': apiKey,
        //     },
        //     body: JSON.stringify({ webhook }),
        //   }
        // );

        // Mock response for now
        registeredWebhooks.push({
          id: `webhook_${Date.now()}_${webhook.topic}`,
          topic: webhook.topic,
          address: webhook.address,
          created_at: new Date().toISOString(),
        });

        console.log(`Registered webhook: ${webhook.topic}`);
      } catch (error) {
        console.error(`Failed to register ${webhook.topic}:`, error);
        errors.push({ topic: webhook.topic, error: 'Registration failed' });
      }
    }

    return NextResponse.json({
      success: true,
      webhooks: registeredWebhooks,
      webhookUrl,
      errors: errors.length > 0 ? errors : undefined,
      message: `${registeredWebhooks.length} webhooks registered successfully`,
    });
  } catch (error) {
    console.error('Webhook registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register webhooks' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const store = searchParams.get('store');
    const apiKey = searchParams.get('apiKey');

    if (!store || !apiKey) {
      return NextResponse.json(
        { error: 'Store URL and API key are required' },
        { status: 400 }
      );
    }

    // In production, fetch actual webhooks from Shopify
    // const response = await fetch(
    //   `https://${store}/admin/api/2024-01/webhooks.json`,
    //   {
    //     headers: {
    //       'X-Shopify-Access-Token': apiKey,
    //     },
    //   }
    // );

    // Mock response
    const webhooks = [
      {
        id: 'webhook_001',
        topic: 'customers/create',
        address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`,
        created_at: new Date().toISOString(),
      },
      {
        id: 'webhook_002',
        topic: 'customers/update',
        address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`,
        created_at: new Date().toISOString(),
      },
      {
        id: 'webhook_003',
        topic: 'customers/delete',
        address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`,
        created_at: new Date().toISOString(),
      },
    ];

    return NextResponse.json({ webhooks });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const store = searchParams.get('store');
    const apiKey = searchParams.get('apiKey');
    const webhookId = searchParams.get('webhookId');

    if (!store || !apiKey || !webhookId) {
      return NextResponse.json(
        { error: 'Store URL, API key, and webhook ID are required' },
        { status: 400 }
      );
    }

    // In production, delete from Shopify
    // await fetch(
    //   `https://${store}/admin/api/2024-01/webhooks/${webhookId}.json`,
    //   {
    //     method: 'DELETE',
    //     headers: {
    //       'X-Shopify-Access-Token': apiKey,
    //     },
    //   }
    // );

    console.log(`Deleted webhook: ${webhookId}`);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
