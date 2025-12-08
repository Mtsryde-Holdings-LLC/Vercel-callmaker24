import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: "Forbidden - No organization" },
        { status: 403 }
      );
    }

    const { store, apiKey, apiVersion = "2024-01" } = await request.json();

    if (!store || !apiKey) {
      return NextResponse.json(
        { error: "Store URL and API key are required" },
        { status: 400 }
      );
    }

    const webhookUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "https://callmaker24.com"
    }/api/webhooks/shopify`;
    const orderWebhookUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "https://callmaker24.com"
    }/api/webhooks/shopify/orders`;
    const webhooks = [
      {
        topic: "customers/create",
        address: webhookUrl,
        format: "json",
      },
      {
        topic: "customers/update",
        address: webhookUrl,
        format: "json",
      },
      {
        topic: "customers/delete",
        address: webhookUrl,
        format: "json",
      },
      {
        topic: "orders/create",
        address: orderWebhookUrl,
        format: "json",
      },
      {
        topic: "orders/updated",
        address: orderWebhookUrl,
        format: "json",
      },
      {
        topic: "orders/paid",
        address: orderWebhookUrl,
        format: "json",
      },
      {
        topic: "orders/fulfilled",
        address: orderWebhookUrl,
        format: "json",
      },
      {
        topic: "orders/cancelled",
        address: orderWebhookUrl,
        format: "json",
      },
    ];

    const registeredWebhooks = [];
    const errors = [];

    // Register each webhook with Shopify
    for (const webhook of webhooks) {
      try {
        const response = await fetch(
          `https://${store}/admin/api/${apiVersion}/webhooks.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": apiKey,
            },
            body: JSON.stringify({ webhook }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Failed to register ${webhook.topic}:`, errorData);
          errors.push({
            topic: webhook.topic,
            error: errorData.errors || "Registration failed",
            status: response.status,
          });
          continue;
        }

        const data = await response.json();
        registeredWebhooks.push({
          id: data.webhook.id,
          topic: data.webhook.topic,
          address: data.webhook.address,
          created_at: data.webhook.created_at,
        });

        console.log(`Registered webhook: ${webhook.topic}`);
      } catch (error: any) {
        console.error(`Failed to register ${webhook.topic}:`, error);
        errors.push({
          topic: webhook.topic,
          error: error.message || "Registration failed",
        });
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
    console.error("Webhook registration error:", error);
    return NextResponse.json(
      { error: "Failed to register webhooks" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: "Forbidden - No organization" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const store = searchParams.get("store");
    const apiKey = searchParams.get("apiKey");
    const apiVersion = searchParams.get("apiVersion") || "2024-01";

    if (!store || !apiKey) {
      return NextResponse.json(
        { error: "Store URL and API key are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://${store}/admin/api/${apiVersion}/webhooks.json`,
      {
        headers: {
          "X-Shopify-Access-Token": apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch webhooks from Shopify", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ webhooks: data.webhooks });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: "Forbidden - No organization" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const store = searchParams.get("store");
    const apiKey = searchParams.get("apiKey");
    const webhookId = searchParams.get("webhookId");
    const apiVersion = searchParams.get("apiVersion") || "2024-01";

    if (!store || !apiKey || !webhookId) {
      return NextResponse.json(
        { error: "Store URL, API key, and webhook ID are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://${store}/admin/api/${apiVersion}/webhooks/${webhookId}.json`,
      {
        method: "DELETE",
        headers: {
          "X-Shopify-Access-Token": apiKey,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to delete webhook from Shopify", details: errorData },
        { status: response.status }
      );
    }

    console.log(`Deleted webhook: ${webhookId}`);

    return NextResponse.json({
      success: true,
      message: "Webhook deleted successfully",
    });
  } catch (error: any) {
    console.error("Webhook deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook", details: error.message },
      { status: 500 }
    );
  }
}
