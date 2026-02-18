import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    if (!user || !user.organizationId) {
      return apiError("Forbidden - No organization", {
        status: 403,
        requestId,
      });
    }

    const { store, apiKey, apiVersion = "2024-01" } = await request.json();

    if (!store || !apiKey) {
      return apiError("Store URL and API key are required", {
        status: 400,
        requestId,
      });
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
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
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
      } catch {
        errors.push({
          topic: webhook.topic,
          error: "Registration failed",
        });
      }
    }

    return apiSuccess(
      {
        webhooks: registeredWebhooks,
        webhookUrl,
        errors: errors.length > 0 ? errors : undefined,
        message: `${registeredWebhooks.length} webhooks registered successfully`,
      },
      { requestId },
    );
  },
  { route: "POST /api/integrations/shopify/webhooks" },
);

export const GET = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    if (!user || !user.organizationId) {
      return apiError("Forbidden - No organization", {
        status: 403,
        requestId,
      });
    }

    const { searchParams } = new URL(request.url);
    const store = searchParams.get("store");
    const apiKey = searchParams.get("apiKey");
    const apiVersion = searchParams.get("apiVersion") || "2024-01";

    if (!store || !apiKey) {
      return apiError("Store URL and API key are required", {
        status: 400,
        requestId,
      });
    }

    const response = await fetch(
      `https://${store}/admin/api/${apiVersion}/webhooks.json`,
      {
        headers: {
          "X-Shopify-Access-Token": apiKey,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return apiError("Failed to fetch webhooks from Shopify", {
        status: response.status,
        requestId,
      });
    }

    const data = await response.json();
    return apiSuccess({ webhooks: data.webhooks }, { requestId });
  },
  { route: "GET /api/integrations/shopify/webhooks" },
);

export const DELETE = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    if (!user || !user.organizationId) {
      return apiError("Forbidden - No organization", {
        status: 403,
        requestId,
      });
    }

    const { searchParams } = new URL(request.url);
    const store = searchParams.get("store");
    const apiKey = searchParams.get("apiKey");
    const webhookId = searchParams.get("webhookId");
    const apiVersion = searchParams.get("apiVersion") || "2024-01";

    if (!store || !apiKey || !webhookId) {
      return apiError("Store URL, API key, and webhook ID are required", {
        status: 400,
        requestId,
      });
    }

    const response = await fetch(
      `https://${store}/admin/api/${apiVersion}/webhooks/${webhookId}.json`,
      {
        method: "DELETE",
        headers: {
          "X-Shopify-Access-Token": apiKey,
        },
      },
    );

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json().catch(() => ({}));
      return apiError("Failed to delete webhook from Shopify", {
        status: response.status,
        requestId,
      });
    }

    return apiSuccess(
      { message: "Webhook deleted successfully" },
      { requestId },
    );
  },
  { route: "DELETE /api/integrations/shopify/webhooks" },
);
