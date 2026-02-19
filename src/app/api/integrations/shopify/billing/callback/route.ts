import { NextRequest, NextResponse } from "next/server";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { ShopifyBillingService } from "@/services/shopify-billing.service";
import {
  type SubscriptionTier,
  type BillingPeriod,
  SUBSCRIPTION_PLANS,
} from "@/config/subscriptions";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/shopify/billing/callback
 * Shopify redirects here after the merchant approves/declines a charge.
 * Query params: charge_id, org, user, plan, billing
 */
export const GET = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const chargeId = searchParams.get("charge_id");
    const organizationId = searchParams.get("org");
    const userId = searchParams.get("user");
    const plan = searchParams.get("plan") as SubscriptionTier | null;
    const billingPeriod = (searchParams.get("billing") ||
      "monthly") as BillingPeriod;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://callmaker24.com";

    if (!chargeId || !organizationId || !userId || !plan) {
      logger.warn("Shopify billing callback missing params", {
        route: "shopify-billing-callback",
        chargeId,
        organizationId,
        userId,
        plan,
        requestId,
      });
      return NextResponse.redirect(
        `${appUrl}/dashboard/subscription?error=missing_params`,
      );
    }

    if (!SUBSCRIPTION_PLANS[plan]) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/subscription?error=invalid_plan`,
      );
    }

    const result = await ShopifyBillingService.activateRecurringCharge(
      organizationId,
      userId,
      chargeId,
      plan,
      billingPeriod,
    );

    if (!result.success) {
      logger.warn("Shopify charge activation failed", {
        route: "shopify-billing-callback",
        chargeId,
        error: result.error,
        requestId,
      });

      const errorMsg = encodeURIComponent(result.error || "activation_failed");
      return NextResponse.redirect(
        `${appUrl}/dashboard/subscription?error=${errorMsg}`,
      );
    }

    logger.info("Shopify billing callback successful", {
      route: "shopify-billing-callback",
      chargeId,
      plan,
      billingPeriod,
      requestId,
    });

    return NextResponse.redirect(
      `${appUrl}/dashboard/subscription?shopify_billing=success&plan=${plan}`,
    );
  },
  { route: "GET /api/integrations/shopify/billing/callback" },
);
