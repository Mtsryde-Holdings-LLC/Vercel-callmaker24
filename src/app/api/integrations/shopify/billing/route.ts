import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { ShopifyBillingService } from "@/services/shopify-billing.service";
import {
  type SubscriptionTier,
  type BillingPeriod,
  SUBSCRIPTION_PLANS,
} from "@/config/subscriptions";

export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/shopify/billing
 * Create a Shopify recurring charge for a subscription plan.
 * Returns a confirmation URL for the merchant to approve.
 */
export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const body = await request.json();
    const { plan, billingPeriod = "monthly" } = body as {
      plan: SubscriptionTier;
      billingPeriod?: BillingPeriod;
    };

    if (!plan || !SUBSCRIPTION_PLANS[plan]) {
      return apiError(
        "Invalid plan. Valid options: STARTER, ELITE, PRO, ENTERPRISE",
        {
          status: 400,
          requestId,
        },
      );
    }

    if (!["monthly", "annual"].includes(billingPeriod)) {
      return apiError("Invalid billing period. Use 'monthly' or 'annual'.", {
        status: 400,
        requestId,
      });
    }

    const result = await ShopifyBillingService.createRecurringCharge(
      organizationId,
      session.user.id,
      plan,
      billingPeriod,
    );

    if (!result.success) {
      return apiError(result.error || "Failed to create billing charge", {
        status: 400,
        requestId,
      });
    }

    return apiSuccess(
      {
        confirmationUrl: result.confirmationUrl,
        chargeId: result.chargeId,
        plan,
        billingPeriod,
      },
      { requestId },
    );
  },
  {
    route: "POST /api/integrations/shopify/billing",
    rateLimit: RATE_LIMITS.standard,
  },
);

/**
 * GET /api/integrations/shopify/billing
 * Get the current Shopify billing status for the organization.
 */
export const GET = withApiHandler(
  async (
    _request: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    // Get active subscriptions from Shopify
    const shopifySubs =
      await ShopifyBillingService.getActiveSubscriptions(organizationId);

    // Sync billing status
    await ShopifyBillingService.syncBillingStatus(
      organizationId,
      session.user.id,
    );

    // Get local subscription record
    const { prisma } = await import("@/lib/prisma");
    const localSub = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    return apiSuccess(
      {
        billingProvider: localSub?.billingProvider || null,
        plan: localSub?.plan || "FREE",
        status: localSub?.status || "ACTIVE",
        shopifyChargeId: localSub?.shopifyChargeId || null,
        currentPeriodStart: localSub?.currentPeriodStart || null,
        currentPeriodEnd: localSub?.currentPeriodEnd || null,
        trialEnd: localSub?.trialEnd || null,
        cancelAtPeriodEnd: localSub?.cancelAtPeriodEnd || false,
        shopifyActiveSubscriptions: shopifySubs.success
          ? shopifySubs.subscriptions
          : [],
      },
      { requestId },
    );
  },
  {
    route: "GET /api/integrations/shopify/billing",
    rateLimit: RATE_LIMITS.standard,
  },
);

/**
 * DELETE /api/integrations/shopify/billing
 * Cancel the Shopify recurring charge.
 */
export const DELETE = withApiHandler(
  async (
    _request: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const result = await ShopifyBillingService.cancelSubscription(
      organizationId,
      session.user.id,
    );

    if (!result.success) {
      return apiError(result.error || "Failed to cancel subscription", {
        status: 400,
        requestId,
      });
    }

    return apiSuccess(
      { message: "Shopify subscription cancelled successfully" },
      { requestId },
    );
  },
  {
    route: "DELETE /api/integrations/shopify/billing",
    rateLimit: RATE_LIMITS.standard,
  },
);
