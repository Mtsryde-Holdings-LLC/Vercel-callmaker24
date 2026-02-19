/**
 * Shopify OAuth Request Verification Utilities
 * 
 * Handles HMAC verification for OAuth callbacks, nonce generation/validation,
 * and shop domain validation per Shopify App Store requirements.
 */

import crypto from "crypto";
import { logger } from "@/lib/logger";

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";

/**
 * Verify Shopify OAuth callback HMAC signature.
 * Shopify sends an HMAC as a query parameter during OAuth callbacks.
 * We must verify it to ensure the request genuinely came from Shopify.
 *
 * @see https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
 */
export function verifyOAuthHmac(
  queryParams: URLSearchParams,
  secret: string = SHOPIFY_API_SECRET,
): boolean {
  if (!secret) {
    logger.error("SHOPIFY_API_SECRET not configured for HMAC verification", {
      route: "shopify-verify-request",
    });
    return false;
  }

  const hmac = queryParams.get("hmac");
  if (!hmac) return false;

  // Build the message string from all query params EXCEPT hmac
  const params = new URLSearchParams();
  queryParams.forEach((value, key) => {
    if (key !== "hmac") {
      params.set(key, value);
    }
  });

  // Sort params alphabetically by key
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  try {
    const computedHmac = crypto
      .createHmac("sha256", secret)
      .update(sortedParams)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(computedHmac, "hex"),
      Buffer.from(hmac, "hex"),
    );
  } catch (error) {
    logger.error(
      "HMAC verification failed",
      { route: "shopify-verify-request" },
      error,
    );
    return false;
  }
}

/**
 * Generate a cryptographically random nonce for OAuth state.
 * Used to prevent CSRF attacks during the OAuth flow.
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Validate a Shopify shop domain format.
 * Must match: {store}.myshopify.com
 */
export function isValidShopDomain(shop: string): boolean {
  if (!shop) return false;
  // Shopify shop domains must end with .myshopify.com
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
}

/**
 * Sanitize and validate a shop domain from user input.
 * Handles cases where merchants might enter full URLs or just the subdomain.
 */
export function sanitizeShopDomain(input: string): string | null {
  if (!input) return null;

  let shop = input.trim().toLowerCase();

  // Remove protocol if present
  shop = shop.replace(/^https?:\/\//, "");
  // Remove trailing slashes
  shop = shop.replace(/\/+$/, "");
  // Remove /admin or other paths
  shop = shop.replace(/\/.*$/, "");

  // If just the subdomain, append .myshopify.com
  if (!shop.includes(".")) {
    shop = `${shop}.myshopify.com`;
  }

  return isValidShopDomain(shop) ? shop : null;
}

/**
 * Build the Shopify app URL for redirection after OAuth.
 * Uses the host parameter that Shopify provides for embedded apps.
 */
export function buildEmbeddedAppUrl(host: string): string {
  // The host param from Shopify is base64-encoded admin domain
  const decodedHost = Buffer.from(host, "base64").toString("utf8");
  return `https://${decodedHost}/apps/${process.env.SHOPIFY_API_KEY}`;
}

/**
 * Build the OAuth authorization URL for Shopify.
 */
export function buildAuthUrl(params: {
  shop: string;
  scopes: string;
  redirectUri: string;
  state: string;
}): string {
  const { shop, scopes, redirectUri, state } = params;
  const queryParams = new URLSearchParams({
    client_id: process.env.SHOPIFY_API_KEY || "",
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  return `https://${shop}/admin/oauth/authorize?${queryParams.toString()}`;
}
