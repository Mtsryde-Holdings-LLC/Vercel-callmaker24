/**
 * GET /api/shopify/install
 *
 * Shopify App Install / OAuth Initiation
 *
 * This is the entry point for the Shopify OAuth flow. When a merchant installs
 * the app from the Shopify App Store, Shopify redirects them here with ?shop=xxx.
 *
 * Flow:
 * 1. Validate the shop domain
 * 2. Generate a nonce for CSRF protection
 * 3. Build the Shopify OAuth authorize URL
 * 4. Redirect the merchant to Shopify to approve scopes
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  isValidShopDomain,
  sanitizeShopDomain,
  generateNonce,
  buildAuthUrl,
} from "@/lib/shopify/verify-request";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const SHOPIFY_SCOPES =
  "read_customers,write_customers,read_orders,read_products,read_inventory,read_own_subscription_contracts,write_own_subscription_contracts";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopParam = searchParams.get("shop");
  const host = searchParams.get("host") || "";

  if (!shopParam) {
    return NextResponse.json(
      { error: "Missing shop parameter" },
      { status: 400 },
    );
  }

  // Sanitize and validate shop domain
  const shop = sanitizeShopDomain(shopParam);
  if (!shop || !isValidShopDomain(shop)) {
    logger.warn("Invalid shop domain in install request", {
      route: "shopify-install",
      shopParam,
      sanitized: shop,
    });
    return NextResponse.json(
      { error: "Invalid shop domain. Must be {store}.myshopify.com" },
      { status: 400 },
    );
  }

  // Generate a cryptographic nonce for CSRF protection
  const nonce = generateNonce();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://callmaker24.com";
  const redirectUri = `${appUrl}/api/shopify/callback`;

  // Store nonce in a cookie for verification in the callback
  // Also store the host for embedded app redirection
  const state = JSON.stringify({ nonce, host });

  const authUrl = buildAuthUrl({
    shop,
    scopes: SHOPIFY_SCOPES,
    redirectUri,
    state,
  });

  logger.info("Initiating Shopify OAuth install", {
    route: "shopify-install",
    shop,
    hasHost: !!host,
  });

  // Set nonce cookie for CSRF verification in callback
  const response = NextResponse.redirect(authUrl);
  response.cookies.set("shopify_nonce", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
