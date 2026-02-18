import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

/**
 * Verify Twitter/X webhook signature (HMAC-SHA256)
 */
function verifyTwitterSignature(
  rawBody: string,
  signature: string | null,
  consumerSecret: string,
): boolean {
  if (!signature) return false;
  try {
    const hmac = crypto
      .createHmac("sha256", consumerSecret)
      .update(rawBody)
      .digest("base64");
    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${hmac}`),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

// Twitter webhook CRC validation
export const GET = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const { searchParams } = new URL(req.url);
    const crc_token = searchParams.get("crc_token");

    if (!crc_token) {
      return apiError("Missing crc_token", { status: 400, requestId });
    }

    const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
    if (!consumerSecret) {
      return apiError("Server misconfigured", { status: 500, requestId });
    }

    const hmac = crypto
      .createHmac("sha256", consumerSecret)
      .update(crc_token)
      .digest("base64");

    return apiSuccess({ response_token: `sha256=${hmac}` }, { requestId });
  },
  { route: "GET /api/webhooks/twitter" },
);

// Twitter webhook events
export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
    if (!consumerSecret) {
      logger.error("TWITTER_CONSUMER_SECRET not configured", {
        requestId,
        route: "/api/webhooks/twitter",
      });
      return apiError("Server misconfigured", { status: 500, requestId });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-twitter-webhooks-signature");

    if (!verifyTwitterSignature(rawBody, signature, consumerSecret)) {
      logger.warn("Invalid Twitter webhook signature", {
        requestId,
        route: "/api/webhooks/twitter",
      });
      return apiError("Invalid signature", { status: 403, requestId });
    }

    const body = JSON.parse(rawBody);

    // Handle different Twitter events
    if (body.tweet_create_events) {
      for (const tweet of body.tweet_create_events) {
        // TODO: Process tweet mentions/replies
      }
    }

    if (body.direct_message_events) {
      for (const dm of body.direct_message_events) {
        // TODO: Process direct messages
      }
    }

    if (body.favorite_events) {
      for (const fav of body.favorite_events) {
        // TODO: Update engagement metrics
      }
    }

    return apiSuccess({ received: true }, { requestId });
  },
  { route: "POST /api/webhooks/twitter" },
);
