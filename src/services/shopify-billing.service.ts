/**
 * Shopify Billing API Service
 *
 * Manages subscription billing through Shopify's Recurring Application Charges API.
 * Supports creating, activating, cancelling, and syncing subscriptions via Shopify
 * as an alternative billing provider alongside Stripe.
 *
 * Shopify Billing API Flow:
 * 1. Create a RecurringApplicationCharge → get confirmation URL
 * 2. Redirect merchant to confirmation URL to approve the charge
 * 3. Shopify redirects back to our callback with charge_id
 * 4. Activate the charge via API
 * 5. Shopify sends webhooks for billing events (app_subscriptions/update)
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { withRetry, RETRY_CONFIGS } from "@/lib/retry";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionTier,
  type BillingPeriod,
} from "@/config/subscriptions";

interface ShopifyCredentials {
  shop: string;
  accessToken: string;
}

interface RecurringCharge {
  id: number;
  name: string;
  api_client_id: number;
  price: string;
  status: string;
  return_url: string;
  created_at: string;
  updated_at: string;
  test: boolean | null;
  activated_on: string | null;
  cancelled_on: string | null;
  trial_days: number;
  trial_ends_on: string | null;
  confirmation_url?: string;
  capped_amount?: string;
  balance_used?: number;
  balance_remaining?: number;
}

interface ShopifyGraphQLResponse {
  data?: {
    appSubscriptionCreate?: {
      appSubscription?: {
        id: string;
        status: string;
      };
      confirmationUrl?: string;
      userErrors?: Array<{ field: string[]; message: string }>;
    };
    appSubscriptionCancel?: {
      appSubscription?: {
        id: string;
        status: string;
      };
      userErrors?: Array<{ field: string[]; message: string }>;
    };
    currentAppInstallation?: {
      activeSubscriptions?: Array<{
        id: string;
        name: string;
        status: string;
        lineItems: Array<{
          plan: {
            pricingDetails: {
              price: { amount: string; currencyCode: string };
              interval: string;
            };
          };
        }>;
        currentPeriodEnd: string | null;
        trialDays: number;
        test: boolean;
        createdAt: string;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

export class ShopifyBillingService {
  /**
   * Get Shopify credentials for an organization
   */
  static async getCredentials(
    organizationId: string,
  ): Promise<ShopifyCredentials | null> {
    try {
      const integration = await prisma.integration.findUnique({
        where: {
          organizationId_platform: {
            organizationId,
            platform: "SHOPIFY",
          },
        },
      });

      if (!integration?.isActive || !integration.credentials) {
        return null;
      }

      const creds = integration.credentials as Record<string, string>;
      if (!creds.shop || !creds.accessToken) return null;

      return {
        shop: creds.shop,
        accessToken: creds.accessToken,
      };
    } catch (error) {
      logger.error(
        "Failed to get Shopify credentials",
        { route: "shopify-billing" },
        error,
      );
      return null;
    }
  }

  /**
   * Make a Shopify Admin REST API call
   */
  private static async shopifyRestApi<T>(
    shop: string,
    accessToken: string,
    endpoint: string,
    method: string = "GET",
    body?: unknown,
  ): Promise<T> {
    const url = `https://${shop}/admin/api/2024-01/${endpoint}`;

    const response = await withRetry(
      () =>
        fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        }),
      RETRY_CONFIGS.shopify,
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shopify API error ${response.status}: ${errorBody}`);
    }

    return response.json();
  }

  /**
   * Make a Shopify Admin GraphQL API call
   */
  private static async shopifyGraphQL(
    shop: string,
    accessToken: string,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<ShopifyGraphQLResponse> {
    const url = `https://${shop}/admin/api/2024-01/graphql.json`;

    const response = await withRetry(
      () =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({ query, variables }),
        }),
      RETRY_CONFIGS.shopify,
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shopify GraphQL error ${response.status}: ${errorBody}`);
    }

    return response.json();
  }

  /**
   * Create a recurring application charge (REST API approach)
   * Returns confirmation URL for the merchant to approve
   */
  static async createRecurringCharge(
    organizationId: string,
    userId: string,
    plan: SubscriptionTier,
    billingPeriod: BillingPeriod,
  ): Promise<{
    success: boolean;
    confirmationUrl?: string;
    chargeId?: number;
    error?: string;
  }> {
    try {
      const credentials = await this.getCredentials(organizationId);
      if (!credentials) {
        return {
          success: false,
          error:
            "Shopify is not connected. Please connect your Shopify store first.",
        };
      }

      const planConfig = SUBSCRIPTION_PLANS[plan];
      if (!planConfig) {
        return { success: false, error: `Invalid plan: ${plan}` };
      }

      const price =
        billingPeriod === "annual"
          ? (planConfig.annualPrice / 12).toFixed(2) // Monthly charge for annual pricing
          : planConfig.monthlyPrice.toFixed(2);

      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://callmaker24.com"}/api/integrations/shopify/billing/callback?org=${organizationId}&user=${userId}&plan=${plan}&billing=${billingPeriod}`;

      const isTestMode =
        process.env.NODE_ENV !== "production" ||
        process.env.SHOPIFY_BILLING_TEST === "true";

      const chargeData = {
        recurring_application_charge: {
          name: `CallMaker24 ${planConfig.name} Plan (${billingPeriod === "annual" ? "Annual" : "Monthly"})`,
          price,
          return_url: returnUrl,
          trial_days: 30,
          test: isTestMode || null,
          capped_amount:
            billingPeriod === "annual"
              ? planConfig.annualPrice.toFixed(2)
              : undefined,
        },
      };

      const result = await this.shopifyRestApi<{
        recurring_application_charge: RecurringCharge;
      }>(
        credentials.shop,
        credentials.accessToken,
        "recurring_application_charges.json",
        "POST",
        chargeData,
      );

      const charge = result.recurring_application_charge;

      logger.info("Shopify recurring charge created", {
        route: "shopify-billing",
        chargeId: charge.id,
        plan,
        billingPeriod,
        price,
        organizationId,
      });

      return {
        success: true,
        confirmationUrl: charge.confirmation_url,
        chargeId: charge.id,
      };
    } catch (error: any) {
      logger.error(
        "Failed to create Shopify recurring charge",
        { route: "shopify-billing", organizationId, plan },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a subscription using Shopify GraphQL AppSubscription API
   * This is the modern approach using GraphQL mutations
   */
  static async createAppSubscription(
    organizationId: string,
    userId: string,
    plan: SubscriptionTier,
    billingPeriod: BillingPeriod,
  ): Promise<{
    success: boolean;
    confirmationUrl?: string;
    subscriptionId?: string;
    error?: string;
  }> {
    try {
      const credentials = await this.getCredentials(organizationId);
      if (!credentials) {
        return {
          success: false,
          error:
            "Shopify is not connected. Please connect your Shopify store first.",
        };
      }

      const planConfig = SUBSCRIPTION_PLANS[plan];
      if (!planConfig) {
        return { success: false, error: `Invalid plan: ${plan}` };
      }

      const price =
        billingPeriod === "annual"
          ? (planConfig.annualPrice / 12).toFixed(2)
          : planConfig.monthlyPrice.toFixed(2);

      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://callmaker24.com"}/api/integrations/shopify/billing/callback?org=${organizationId}&user=${userId}&plan=${plan}&billing=${billingPeriod}`;

      const isTestMode =
        process.env.NODE_ENV !== "production" ||
        process.env.SHOPIFY_BILLING_TEST === "true";

      const interval = billingPeriod === "annual" ? "ANNUAL" : "EVERY_30_DAYS";

      const mutation = `
        mutation appSubscriptionCreate(
          $name: String!
          $lineItems: [AppSubscriptionLineItemInput!]!
          $returnUrl: URL!
          $trialDays: Int
          $test: Boolean
        ) {
          appSubscriptionCreate(
            name: $name
            lineItems: $lineItems
            returnUrl: $returnUrl
            trialDays: $trialDays
            test: $test
          ) {
            appSubscription {
              id
              status
            }
            confirmationUrl
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        name: `CallMaker24 ${planConfig.name} Plan`,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: { amount: parseFloat(price), currencyCode: "USD" },
                interval,
              },
            },
          },
        ],
        returnUrl,
        trialDays: 30,
        test: isTestMode,
      };

      const result = await this.shopifyGraphQL(
        credentials.shop,
        credentials.accessToken,
        mutation,
        variables,
      );

      if (result.errors?.length) {
        throw new Error(result.errors.map((e) => e.message).join(", "));
      }

      const subCreate = result.data?.appSubscriptionCreate;
      if (subCreate?.userErrors?.length) {
        throw new Error(subCreate.userErrors.map((e) => e.message).join(", "));
      }

      const subscriptionId = subCreate?.appSubscription?.id;
      const confirmationUrl = subCreate?.confirmationUrl;

      logger.info("Shopify app subscription created", {
        route: "shopify-billing",
        subscriptionId,
        plan,
        billingPeriod,
        organizationId,
      });

      return {
        success: true,
        confirmationUrl: confirmationUrl || undefined,
        subscriptionId: subscriptionId || undefined,
      };
    } catch (error: any) {
      logger.error(
        "Failed to create Shopify app subscription",
        { route: "shopify-billing", organizationId, plan },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Activate a recurring charge after merchant approves it
   */
  static async activateRecurringCharge(
    organizationId: string,
    userId: string,
    chargeId: string,
    plan: SubscriptionTier,
    billingPeriod: BillingPeriod,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const credentials = await this.getCredentials(organizationId);
      if (!credentials) {
        return { success: false, error: "Shopify not connected" };
      }

      // Fetch the charge to verify its status
      const chargeResult = await this.shopifyRestApi<{
        recurring_application_charge: RecurringCharge;
      }>(
        credentials.shop,
        credentials.accessToken,
        `recurring_application_charges/${chargeId}.json`,
      );

      const charge = chargeResult.recurring_application_charge;

      if (charge.status === "declined") {
        logger.warn("Shopify charge was declined", {
          route: "shopify-billing",
          chargeId,
          organizationId,
        });
        return {
          success: false,
          error: "The charge was declined by the merchant.",
        };
      }

      if (charge.status === "expired") {
        return {
          success: false,
          error: "The charge has expired. Please try again.",
        };
      }

      // Activate the charge if pending
      if (charge.status === "pending" || charge.status === "accepted") {
        await this.shopifyRestApi(
          credentials.shop,
          credentials.accessToken,
          `recurring_application_charges/${chargeId}/activate.json`,
          "POST",
        );
      }

      const planConfig = SUBSCRIPTION_PLANS[plan];
      const now = new Date();

      // Upsert subscription in database
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: charge.trial_days > 0 ? "TRIALING" : "ACTIVE",
          billingProvider: "shopify",
          shopifyChargeId: chargeId.toString(),
          shopifyShop: credentials.shop,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          trialStart: charge.trial_days > 0 ? now : null,
          trialEnd:
            charge.trial_days > 0
              ? new Date(
                  now.getTime() + charge.trial_days * 24 * 60 * 60 * 1000,
                )
              : null,
          emailCredits: planConfig.features.maxEmailsPerMonth,
          smsCredits: planConfig.features.maxSMSPerMonth,
        },
        update: {
          plan,
          status: charge.trial_days > 0 ? "TRIALING" : "ACTIVE",
          billingProvider: "shopify",
          shopifyChargeId: chargeId.toString(),
          shopifyShop: credentials.shop,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          cancelledAt: null,
        },
      });

      // Update organization subscription tier
      await prisma.organization.update({
        where: {
          id: organizationId,
        },
        data: {
          subscriptionTier: plan,
          subscriptionStatus: charge.trial_days > 0 ? "TRIALING" : "ACTIVE",
          subscriptionStartDate: now,
          maxAgents: planConfig.features.maxAgents,
          maxCustomers: planConfig.features.maxCustomers,
          maxCampaigns: planConfig.features.maxCampaigns,
          maxEmailsPerMonth: planConfig.features.maxEmailsPerMonth,
          maxSMSPerMonth: planConfig.features.maxSMSPerMonth,
          maxVoiceMinutesPerMonth: planConfig.features.maxVoiceMinutesPerMonth,
          maxSubAdmins: planConfig.features.maxSubAdmins,
        },
      });

      logger.info("Shopify subscription activated", {
        route: "shopify-billing",
        chargeId,
        plan,
        organizationId,
        userId,
      });

      return { success: true };
    } catch (error: any) {
      logger.error(
        "Failed to activate Shopify charge",
        { route: "shopify-billing", chargeId, organizationId },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel a Shopify recurring charge
   */
  static async cancelSubscription(
    organizationId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription || subscription.billingProvider !== "shopify") {
        return {
          success: false,
          error: "No active Shopify subscription found",
        };
      }

      const credentials = await this.getCredentials(organizationId);
      if (!credentials) {
        return { success: false, error: "Shopify not connected" };
      }

      if (subscription.shopifyChargeId) {
        // Cancel via REST API
        await this.shopifyRestApi(
          credentials.shop,
          credentials.accessToken,
          `recurring_application_charges/${subscription.shopifyChargeId}.json`,
          "DELETE",
        );
      }

      // Update subscription status
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      });

      // Downgrade organization
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionTier: "FREE",
          subscriptionStatus: "CANCELLED",
        },
      });

      logger.info("Shopify subscription cancelled", {
        route: "shopify-billing",
        chargeId: subscription.shopifyChargeId,
        organizationId,
        userId,
      });

      return { success: true };
    } catch (error: any) {
      logger.error(
        "Failed to cancel Shopify subscription",
        { route: "shopify-billing", organizationId },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active Shopify subscriptions via GraphQL
   */
  static async getActiveSubscriptions(organizationId: string): Promise<{
    success: boolean;
    subscriptions?: Array<{
      id: string;
      name: string;
      status: string;
      price: string;
      interval: string;
      currentPeriodEnd: string | null;
      trialDays: number;
      test: boolean;
    }>;
    error?: string;
  }> {
    try {
      const credentials = await this.getCredentials(organizationId);
      if (!credentials) {
        return { success: false, error: "Shopify not connected" };
      }

      const query = `
        {
          currentAppInstallation {
            activeSubscriptions {
              id
              name
              status
              lineItems {
                plan {
                  pricingDetails {
                    ... on AppRecurringPricing {
                      price {
                        amount
                        currencyCode
                      }
                      interval
                    }
                  }
                }
              }
              currentPeriodEnd
              trialDays
              test
              createdAt
            }
          }
        }
      `;

      const result = await this.shopifyGraphQL(
        credentials.shop,
        credentials.accessToken,
        query,
      );

      const activeSubs =
        result.data?.currentAppInstallation?.activeSubscriptions || [];

      const subscriptions = activeSubs.map((sub) => ({
        id: sub.id,
        name: sub.name,
        status: sub.status,
        price: sub.lineItems[0]?.plan?.pricingDetails?.price?.amount || "0",
        interval:
          sub.lineItems[0]?.plan?.pricingDetails?.interval || "EVERY_30_DAYS",
        currentPeriodEnd: sub.currentPeriodEnd,
        trialDays: sub.trialDays,
        test: sub.test,
      }));

      return { success: true, subscriptions };
    } catch (error: any) {
      logger.error(
        "Failed to get Shopify subscriptions",
        { route: "shopify-billing", organizationId },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync Shopify billing status with local database
   * Called periodically or on webhook events
   */
  static async syncBillingStatus(
    organizationId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription || subscription.billingProvider !== "shopify") {
        return { success: true }; // Nothing to sync
      }

      const credentials = await this.getCredentials(organizationId);
      if (!credentials || !subscription.shopifyChargeId) {
        return { success: true };
      }

      // Fetch latest charge status
      const chargeResult = await this.shopifyRestApi<{
        recurring_application_charge: RecurringCharge;
      }>(
        credentials.shop,
        credentials.accessToken,
        `recurring_application_charges/${subscription.shopifyChargeId}.json`,
      );

      const charge = chargeResult.recurring_application_charge;
      let newStatus = subscription.status;

      switch (charge.status) {
        case "active":
          newStatus = "ACTIVE";
          break;
        case "frozen":
        case "pending":
          newStatus = "PAST_DUE";
          break;
        case "cancelled":
        case "declined":
        case "expired":
          newStatus = "CANCELLED";
          break;
      }

      if (newStatus !== subscription.status) {
        await prisma.subscription.update({
          where: { userId },
          data: {
            status: newStatus,
            ...(newStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
          },
        });

        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            subscriptionStatus: newStatus,
            ...(newStatus === "CANCELLED" ? { subscriptionTier: "FREE" } : {}),
          },
        });

        logger.info("Shopify billing status synced", {
          route: "shopify-billing",
          organizationId,
          oldStatus: subscription.status,
          newStatus,
          chargeStatus: charge.status,
        });
      }

      return { success: true };
    } catch (error: any) {
      logger.error(
        "Failed to sync Shopify billing status",
        { route: "shopify-billing", organizationId },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle Shopify billing webhook (app_subscriptions/update)
   */
  static async handleBillingWebhook(
    topic: string,
    shopDomain: string,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const appSub = payload.app_subscription as
        | Record<string, unknown>
        | undefined;
      const chargeId = (appSub?.id as string) || (payload.id as string);

      if (!chargeId) {
        logger.warn("Shopify billing webhook missing charge ID", {
          route: "shopify-billing",
          topic,
          shopDomain,
        });
        return { success: false, error: "Missing charge ID" };
      }

      // Find subscription by shopify charge ID
      const subscription = await prisma.subscription.findFirst({
        where: {
          OR: [
            { shopifyChargeId: chargeId.toString() },
            { shopifyShop: shopDomain },
          ],
          billingProvider: "shopify",
        },
        include: { user: { include: { organization: true } } },
      });

      if (!subscription) {
        logger.warn("No local subscription found for Shopify webhook", {
          route: "shopify-billing",
          chargeId,
          shopDomain,
          topic,
        });
        return { success: true }; // Don't error — may be for a different app
      }

      const status = (appSub?.status as string) || (payload.status as string);

      let newStatus = subscription.status;
      switch (status) {
        case "ACTIVE":
        case "active":
          newStatus = "ACTIVE";
          break;
        case "FROZEN":
        case "frozen":
          newStatus = "PAST_DUE";
          break;
        case "CANCELLED":
        case "cancelled":
        case "DECLINED":
        case "declined":
        case "EXPIRED":
        case "expired":
          newStatus = "CANCELLED";
          break;
        case "PENDING":
        case "pending":
          newStatus = "TRIALING";
          break;
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: newStatus,
          ...(newStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
        },
      });

      if (subscription.user.organizationId) {
        await prisma.organization.update({
          where: { id: subscription.user.organizationId },
          data: {
            subscriptionStatus: newStatus,
            ...(newStatus === "CANCELLED" ? { subscriptionTier: "FREE" } : {}),
          },
        });
      }

      logger.info("Shopify billing webhook processed", {
        route: "shopify-billing",
        topic,
        chargeId,
        shopDomain,
        oldStatus: subscription.status,
        newStatus,
      });

      return { success: true };
    } catch (error: any) {
      logger.error(
        "Failed to process Shopify billing webhook",
        { route: "shopify-billing", topic, shopDomain },
        error,
      );
      return { success: false, error: error.message };
    }
  }
}
