import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { withRetry, RETRY_CONFIGS } from "@/lib/retry";

// Lazy-init Stripe client to avoid crash on missing env vars
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2023-10-16",
    });
  }
  return _stripe;
}

export class PaymentService {
  /**
   * Create Stripe customer
   */
  static async createCustomer(userId: string, email: string, name?: string) {
    try {
      const customer = await withRetry(
        () =>
          getStripe().customers.create({
            email,
            name,
            metadata: { userId },
          }),
        RETRY_CONFIGS.stripe,
      );

      return {
        success: true,
        data: { customerId: customer.id },
      };
    } catch (error: any) {
      logger.error(
        "Create customer error",
        { route: "payment-service" },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Create subscription
   */
  static async createSubscription(
    userId: string,
    priceId: string,
    paymentMethodId?: string,
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscriptions: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      let customerId = user.subscriptions[0]?.stripeCustomerId;

      // Create customer if doesn't exist
      if (!customerId) {
        const customerResult = await this.createCustomer(
          userId,
          user.email!,
          user.name || undefined,
        );
        if (!customerResult.success) {
          throw new Error(customerResult.error);
        }
        customerId = customerResult.data!.customerId;
      }

      // Attach payment method if provided
      if (paymentMethodId) {
        await getStripe().paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

        await getStripe().customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Create subscription
      const subscriptionParams: any = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      };

      // Add default payment method if provided
      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const subscription = await withRetry(
        () => getStripe().subscriptions.create(subscriptionParams),
        RETRY_CONFIGS.stripe,
      );

      // Save subscription to database
      const plan = this.getPlanFromPriceId(priceId);

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: "TRIALING",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        update: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          plan,
          status: "TRIALING",
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });

      return {
        success: true,
        data: {
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent
            ?.client_secret,
        },
      };
    } catch (error: any) {
      logger.error(
        "Create subscription error",
        { route: "payment-service" },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, immediately = false) {
    try {
      const subscription = immediately
        ? await getStripe().subscriptions.cancel(subscriptionId)
        : await getStripe().subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
          });

      // Update database
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: immediately ? "CANCELLED" : "ACTIVE",
          cancelAtPeriodEnd: !immediately,
          cancelledAt: immediately ? new Date() : null,
        },
      });

      return { success: true, data: subscription };
    } catch (error: any) {
      logger.error(
        "Cancel subscription error",
        { route: "payment-service" },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await this.handleSubscriptionUpdate(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "invoice.paid":
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case "invoice.payment_failed":
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`, {
            route: "payment-service",
          });
      }

      return { success: true };
    } catch (error: any) {
      logger.error("Webhook error", { route: "payment-service" }, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle subscription update
   */
  private static async handleSubscriptionUpdate(
    subscription: Stripe.Subscription,
  ) {
    const priceId = subscription.items.data[0].price.id;
    const plan = this.getPlanFromPriceId(priceId);

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status.toUpperCase() as any,
        plan,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  /**
   * Handle subscription deleted
   */
  private static async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
  }

  /**
   * Handle invoice paid
   */
  private static async handleInvoicePaid(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: invoice.subscription as string },
      });

      if (subscription) {
        await prisma.invoice.create({
          data: {
            subscriptionId: subscription.id,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: invoice.status!,
            invoiceUrl: invoice.hosted_invoice_url,
            pdfUrl: invoice.invoice_pdf,
            paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
          },
        });
      }
    }
  }

  /**
   * Handle invoice payment failed
   */
  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: {
          status: "PAST_DUE",
        },
      });
    }
  }

  /**
   * Get plan from price ID
   */
  private static getPlanFromPriceId(priceId: string): any {
    // Monthly plans
    if (priceId === process.env.STRIPE_PRICE_ID_STARTER_MONTHLY)
      return "STARTER";
    if (priceId === process.env.STRIPE_PRICE_ID_ELITE_MONTHLY) return "ELITE";
    if (priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY) return "PRO";
    if (priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY)
      return "ENTERPRISE";

    // Annual plans
    if (priceId === process.env.STRIPE_PRICE_ID_STARTER_ANNUAL)
      return "STARTER";
    if (priceId === process.env.STRIPE_PRICE_ID_ELITE_ANNUAL) return "ELITE";
    if (priceId === process.env.STRIPE_PRICE_ID_PRO_ANNUAL) return "PRO";
    if (priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE_ANNUAL)
      return "ENTERPRISE";

    return "FREE";
  }

  /**
   * Add credits to subscription
   */
  static async addCredits(
    userId: string,
    type: "email" | "sms" | "ai",
    amount: number,
  ) {
    try {
      const fieldName = `${type}Credits`;

      const subscription = await prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription) {
        return { success: false, error: "Subscription not found" };
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          [fieldName]: {
            increment: amount,
          },
        },
      });

      return { success: true };
    } catch (error: any) {
      logger.error("Add credits error", { route: "payment-service" }, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deduct credits from subscription
   */
  static async deductCredits(
    userId: string,
    type: "email" | "sms" | "ai",
    amount: number,
  ) {
    try {
      const fieldName = `${type}Credits`;
      const usedFieldName = `${type}Used`;

      const subscription = await prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription) {
        return { success: false, error: "Subscription not found" };
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          [fieldName]: {
            decrement: amount,
          },
          [usedFieldName]: {
            increment: amount,
          },
        },
      });

      return { success: true };
    } catch (error: any) {
      logger.error("Deduct credits error", { route: "payment-service" }, error);
      return { success: false, error: error.message };
    }
  }
}
