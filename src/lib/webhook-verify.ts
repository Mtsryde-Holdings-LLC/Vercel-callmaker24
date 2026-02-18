/**
 * Webhook Signature Verification Utilities
 * Prevents forged webhook payloads from unauthorized sources.
 */

import crypto from "crypto";
import { logger } from "./logger";

/**
 * Verify Shopify webhook HMAC signature
 */
export function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string | null,
  secret: string,
): boolean {
  if (!hmacHeader || !secret) return false;

  try {
    const hash = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
  } catch (error) {
    logger.error(
      "Shopify HMAC verification error",
      { route: "webhook-verify" },
      error,
    );
    return false;
  }
}

/**
 * Verify Twilio webhook signature
 * Uses X-Twilio-Signature header with HMAC-SHA1
 */
export function verifyTwilioWebhook(
  url: string,
  params: Record<string, string>,
  signature: string | null,
  authToken: string,
): boolean {
  if (!signature || !authToken) return false;

  try {
    // Twilio signs: url + sorted params concatenated
    const sortedKeys = Object.keys(params).sort();
    let data = url;
    for (const key of sortedKeys) {
      data += key + params[key];
    }

    const expected = crypto
      .createHmac("sha1", authToken)
      .update(data)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch (error) {
    logger.error(
      "Twilio signature verification error",
      { route: "webhook-verify" },
      error,
    );
    return false;
  }
}

/**
 * Verify Mailgun webhook signature
 * Uses timestamp + token signed with API key
 */
export function verifyMailgunWebhook(
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string,
): boolean {
  if (!signingKey || !timestamp || !token || !signature) return false;

  try {
    const expected = crypto
      .createHmac("sha256", signingKey)
      .update(timestamp + token)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch (error) {
    logger.error(
      "Mailgun signature verification error",
      { route: "webhook-verify" },
      error,
    );
    return false;
  }
}

/**
 * Verify Facebook webhook signature (X-Hub-Signature-256)
 */
export function verifyFacebookWebhook(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader || !appSecret) return false;

  try {
    const expected =
      "sha256=" +
      crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader),
    );
  } catch (error) {
    logger.error(
      "Facebook signature verification error",
      { route: "webhook-verify" },
      error,
    );
    return false;
  }
}

/**
 * Verify SendGrid Event Webhook signature (v3 – ECDSA)
 *
 * SendGrid signs the raw request body with ECDSA using the public verification
 * key you configure in Mail Settings → Event Webhook → Signed Event Webhook.
 *
 * Headers used:
 *   X-Twilio-Email-Event-Webhook-Signature  – base64‑encoded ECDSA signature
 *   X-Twilio-Email-Event-Webhook-Timestamp  – Unix epoch seconds
 *
 * Verification: verify( timestamp + rawBody ) with the public key.
 */
export function verifySendGridWebhook(
  publicKey: string,
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): boolean {
  if (!publicKey || !signature || !timestamp) return false;

  try {
    const payload = timestamp + rawBody;
    const decodedSignature = Buffer.from(signature, "base64");

    // SendGrid uses ECDSA with P-256 curve
    const verifier = crypto.createVerify("SHA256");
    verifier.update(payload);
    verifier.end();

    return verifier.verify(
      { key: publicKey, dsaEncoding: "der" },
      decodedSignature,
    );
  } catch (error) {
    logger.error(
      "SendGrid signature verification error",
      { route: "webhook-verify" },
      error,
    );
    return false;
  }
}

/**
 * Helper: parse FormData into a plain Record<string, string> for Twilio
 * signature verification (which needs sorted key/value pairs).
 */
export function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

/**
 * Helper: build the full webhook URL from a NextRequest for Twilio verification.
 * Uses the X-Forwarded-Proto / X-Forwarded-Host headers that reverse proxies
 * (Vercel, AWS ALB, etc.) set, falling back to the request URL itself.
 */
export function getWebhookUrl(req: {
  url: string;
  headers: { get(name: string): string | null };
}): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const { pathname } = new URL(req.url);
  return `${proto}://${host}${pathname}`;
}
