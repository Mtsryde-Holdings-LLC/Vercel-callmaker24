/**
 * Shopify App Bridge Session Token Verification
 *
 * Embedded Shopify apps use session tokens (JWTs) from App Bridge
 * instead of cookies for authentication. This module verifies those tokens.
 *
 * @see https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens
 */

import * as jose from "jose";
import { logger } from "@/lib/logger";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || "";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";

export interface ShopifySessionPayload {
  /** The shop's admin domain (e.g., "store.myshopify.com") */
  dest: string;
  /** The shop domain extracted from dest */
  shop: string;
  /** Issued-at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
  /** Audience — should match our API key */
  aud: string;
  /** Issuer — the shop's admin URL */
  iss: string;
  /** Subject — the shop's admin domain */
  sub: string;
  /** Session ID (optional, for online tokens) */
  sid?: string;
  /** JWT ID */
  jti?: string;
  /** Not before */
  nbf?: number;
}

/**
 * Verify a Shopify session token (JWT) from App Bridge.
 *
 * Returns the decoded payload if valid, null if invalid.
 */
export async function verifySessionToken(
  token: string,
): Promise<ShopifySessionPayload | null> {
  if (!token || !SHOPIFY_API_SECRET) {
    logger.warn("Missing session token or API secret", {
      route: "shopify-session-token",
      hasToken: !!token,
      hasSecret: !!SHOPIFY_API_SECRET,
    });
    return null;
  }

  try {
    const secret = new TextEncoder().encode(SHOPIFY_API_SECRET);

    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ["HS256"],
      // The audience should match our API key
      audience: SHOPIFY_API_KEY,
    });

    // Extract shop domain from "dest" claim
    // dest is like "https://store.myshopify.com"
    const dest = payload.dest as string;
    const shop = dest ? new URL(dest).hostname : "";

    // Verify the issuer matches the shop's admin URL
    const expectedIss = `https://${shop}/admin`;
    if (payload.iss !== expectedIss) {
      logger.warn("Session token ISS mismatch", {
        route: "shopify-session-token",
        expected: expectedIss,
        received: payload.iss,
      });
      return null;
    }

    return {
      dest,
      shop,
      iat: payload.iat as number,
      exp: payload.exp as number,
      aud: payload.aud as string,
      iss: payload.iss as string,
      sub: payload.sub as string,
      sid: payload.sid as string | undefined,
      jti: payload.jti as string | undefined,
      nbf: payload.nbf as number | undefined,
    };
  } catch (error) {
    logger.error(
      "Session token verification failed",
      { route: "shopify-session-token" },
      error,
    );
    return null;
  }
}

/**
 * Extract session token from Authorization header.
 * Shopify App Bridge sends it as: Authorization: Bearer <token>
 */
export function extractSessionToken(
  authHeader: string | null,
): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Middleware-style function to verify Shopify session token from request headers.
 * Returns shop domain if valid, null if not.
 */
export async function authenticateShopifyRequest(
  request: Request,
): Promise<{ shop: string; payload: ShopifySessionPayload } | null> {
  const authHeader = request.headers.get("authorization");
  const token = extractSessionToken(authHeader);

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  return { shop: payload.shop, payload };
}
