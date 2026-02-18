import { NextRequest, NextResponse } from "next/server";
import { verifyFacebookWebhook } from "@/lib/webhook-verify";
import { logger } from "@/lib/logger";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";

// Facebook webhook verification and handling
export const GET = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      logger.info("Facebook webhook verified", { route: "webhooks/facebook" });
      return new NextResponse(challenge, { status: 200 });
    }

    return apiError("Forbidden", { status: 403, requestId });
  },
  { route: "GET /api/webhooks/facebook" },
);

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const rawBody = await req.text();

    // Verify Facebook signature
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const signature = req.headers.get("x-hub-signature-256");
    if (!appSecret) {
      logger.error("FACEBOOK_APP_SECRET not configured", {
        requestId,
        route: "webhooks/facebook",
      });
      return apiError("Server misconfigured", { status: 500, requestId });
    }
    if (!verifyFacebookWebhook(rawBody, signature, appSecret)) {
      logger.warn("Invalid Facebook webhook signature", {
        route: "webhooks/facebook",
      });
      return apiError("Invalid signature", { status: 401, requestId });
    }

    const body = JSON.parse(rawBody);

    logger.info("Facebook webhook received", { route: "webhooks/facebook" });

    // Handle Facebook webhook events (comments, messages, etc.)
    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const { field, value } = change;

          logger.debug(`Facebook ${field} event`, {
            route: "webhooks/facebook",
          });

          // TODO: Process Facebook events
          // - Handle comments on posts
          // - Handle messages
          // - Handle reactions
          // - Update engagement metrics
        }
      }
    }

    return apiSuccess({ received: true }, { requestId });
  },
  { route: "POST /api/webhooks/facebook" },
);
