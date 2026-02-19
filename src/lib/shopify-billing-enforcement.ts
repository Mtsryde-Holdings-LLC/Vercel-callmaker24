/**
 * Shopify Billing Enforcement
 *
 * Shopify App Store policy requires that all billing for apps installed via the
 * App Store goes through the Shopify Billing API (RecurringApplicationCharge or
 * AppSubscription mutations). Direct credit card collection (e.g., via Stripe)
 * is prohibited for Shopify App Store apps.
 *
 * This module provides utilities to enforce this requirement.
 */

import { prisma } from "@/lib/prisma";

export interface BillingEnforcementResult {
  /** Whether the org is a Shopify merchant */
  isShopifyMerchant: boolean;
  /** Whether Stripe billing is allowed for this org */
  stripeAllowed: boolean;
  /** Whether Shopify billing is required for this org */
  shopifyRequired: boolean;
  /** The active shop domain (if Shopify merchant) */
  shopDomain: string | null;
  /** Human-readable reason if billing is blocked */
  blockReason: string | null;
}

/**
 * Check whether a given organization must use Shopify billing.
 * Returns enforcement details including whether Stripe is allowed.
 */
export async function checkBillingEnforcement(
  organizationId: string,
  userId?: string,
): Promise<BillingEnforcementResult> {
  // Check for active Shopify integration
  const shopifyIntegration = await prisma.integration.findUnique({
    where: {
      organizationId_platform: {
        organizationId,
        platform: "SHOPIFY",
      },
    },
  });

  const isShopifyMerchant =
    !!shopifyIntegration?.isActive &&
    !!(shopifyIntegration.credentials as Record<string, string>)?.accessToken;

  if (isShopifyMerchant) {
    const creds = shopifyIntegration!.credentials as Record<string, string>;
    return {
      isShopifyMerchant: true,
      stripeAllowed: false,
      shopifyRequired: true,
      shopDomain: creds.shop || null,
      blockReason:
        "Shopify App Store policy requires all billing to go through Shopify. " +
        "Please use Shopify billing to manage your subscription.",
    };
  }

  // Check if existing subscription is on Shopify
  if (userId) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (subscription?.billingProvider === "shopify") {
      return {
        isShopifyMerchant: false,
        stripeAllowed: false,
        shopifyRequired: true,
        shopDomain: subscription.shopifyShop || null,
        blockReason:
          "Your subscription is managed through Shopify. " +
          "Please manage billing through your Shopify admin.",
      };
    }
  }

  return {
    isShopifyMerchant: false,
    stripeAllowed: true,
    shopifyRequired: false,
    shopDomain: null,
    blockReason: null,
  };
}

/**
 * Verify Shopify HMAC signature for OAuth and webhooks.
 * Ensures the request actually came from Shopify.
 */
export function verifyShopifyHmac(
  queryParams: Record<string, string>,
  secret: string,
): boolean {
  const hmac = queryParams.hmac;
  if (!hmac) return false;

  // Build the message string from all params except hmac
  const entries = Object.entries(queryParams)
    .filter(([key]) => key !== "hmac")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const crypto = require("crypto");
  const computed = crypto
    .createHmac("sha256", secret)
    .update(entries)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hmac, "hex"),
    Buffer.from(computed, "hex"),
  );
}

/**
 * Verify Shopify webhook HMAC
 */
export function verifyShopifyWebhookHmac(
  body: string,
  hmacHeader: string,
  secret: string,
): boolean {
  const crypto = require("crypto");
  const computed = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmacHeader, "base64"),
      Buffer.from(computed, "base64"),
    );
  } catch {
    return false;
  }
}
