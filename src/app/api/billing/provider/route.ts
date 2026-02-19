import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/provider
 *
 * Detects the correct billing provider for the current user/organization.
 * Shopify App Store policy requires all billing for apps installed via the
 * App Store to go through Shopify's Billing API. If the org has an active
 * Shopify integration, billing MUST use Shopify.
 *
 * Returns:
 *  - provider: "shopify" | "stripe"
 *  - shopifyShop: shop domain (if Shopify)
 *  - hasActiveSubscription: whether a paid subscription exists
 *  - currentPlan: current plan tier
 *  - billingProvider: the provider of the existing subscription (if any)
 */
export const GET = withApiHandler(
  async (
    _request: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    // Check if the organization has an active Shopify integration
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

    // Get existing subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // Get organization subscription info
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    // Determine the billing provider:
    // - If Shopify is connected → MUST use Shopify (App Store requirement)
    // - If existing subscription is on Shopify → continue with Shopify
    // - Otherwise → use Stripe
    let provider: "shopify" | "stripe" = "stripe";

    if (isShopifyMerchant) {
      provider = "shopify";
    } else if (subscription?.billingProvider === "shopify") {
      provider = "shopify";
    }

    const shopCreds = shopifyIntegration?.credentials as Record<
      string,
      string
    > | null;

    return apiSuccess(
      {
        provider,
        shopifyShop: isShopifyMerchant ? shopCreds?.shop || null : null,
        isShopifyMerchant,
        hasActiveSubscription:
          !!subscription &&
          ["ACTIVE", "TRIALING"].includes(subscription.status),
        currentPlan: organization?.subscriptionTier || "FREE",
        currentStatus: organization?.subscriptionStatus || "ACTIVE",
        billingProvider: subscription?.billingProvider || null,
        shopifyChargeId: subscription?.shopifyChargeId || null,
      },
      { requestId },
    );
  },
  {
    route: "GET /api/billing/provider",
    rateLimit: RATE_LIMITS.standard,
  },
);
