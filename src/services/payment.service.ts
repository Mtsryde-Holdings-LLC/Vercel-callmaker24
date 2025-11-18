import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export class PaymentService {
  /**
   * Create Stripe customer
   */
  static async createCustomer(userId: string, email: string, name?: string) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId },
      })

      return {
        success: true,
        data: { customerId: customer.id },
      }
    } catch (error: any) {
      console.error('Create customer error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create subscription
   */
  static async createSubscription(
    userId: string,
    priceId: string,
    paymentMethodId?: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscriptions: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      let customerId = user.subscriptions[0]?.stripeCustomerId

      // Create customer if doesn't exist
      if (!customerId) {
        const customerResult = await this.createCustomer(
          userId,
          user.email!,
          user.name || undefined
        )
        if (!customerResult.success) {
          throw new Error(customerResult.error)
        }
        customerId = customerResult.data!.customerId
      }

      // Attach payment method if provided
      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        })

        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        })
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      })

      // Save subscription to database
      const plan = this.getPlanFromPriceId(priceId)

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: 'TRIALING',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        update: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          plan,
          status: 'TRIALING',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      })

      return {
        success: true,
        data: {
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        },
      }
    } catch (error: any) {
      console.error('Create subscription error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, immediately = false) {
    try {
      const subscription = immediately
        ? await stripe.subscriptions.cancel(subscriptionId)
        : await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
          })

      // Update database
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: immediately ? 'CANCELLED' : 'ACTIVE',
          cancelAtPeriodEnd: !immediately,
          cancelledAt: immediately ? new Date() : null,
        },
      })

      return { success: true, data: subscription }
    } catch (error: any) {
      console.error('Cancel subscription error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice)
          break

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      return { success: true }
    } catch (error: any) {
      console.error('Webhook error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Handle checkout session completed
   */
  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription' || !session.subscription) {
      return
    }

    const userId = session.metadata?.userId
    if (!userId) {
      console.error('No userId in checkout session metadata')
      return
    }

    // Fetch the subscription to get full details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = subscription.items.data[0].price.id
    const plan = this.getPlanFromPriceId(priceId)

    // Create or update subscription in database
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: subscription.status.toUpperCase() as any,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        emailCredits: this.getCreditsForPlan(plan, 'email'),
        smsCredits: this.getCreditsForPlan(plan, 'sms'),
        aiCredits: this.getCreditsForPlan(plan, 'ai'),
      },
      update: {
        plan,
        status: subscription.status.toUpperCase() as any,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        emailCredits: this.getCreditsForPlan(plan, 'email'),
        smsCredits: this.getCreditsForPlan(plan, 'sms'),
        aiCredits: this.getCreditsForPlan(plan, 'ai'),
      },
    })
  }

  /**
   * Handle subscription update
   */
  private static async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const priceId = subscription.items.data[0].price.id
    const plan = this.getPlanFromPriceId(priceId)

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status.toUpperCase() as any,
        plan,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })
  }

  /**
   * Handle subscription deleted
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })
  }

  /**
   * Handle invoice paid
   */
  private static async handleInvoicePaid(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: invoice.subscription as string },
      })

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
        })
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
          status: 'PAST_DUE',
        },
      })
    }
  }

  /**
   * Get plan from price ID
   */
  private static getPlanFromPriceId(priceId: string): any {
    if (priceId === process.env.STRIPE_PRICE_ID_STARTER) return 'STARTER'
    if (priceId === process.env.STRIPE_PRICE_ID_ELITE) return 'ELITE'
    if (priceId === process.env.STRIPE_PRICE_ID_PROFESSIONAL) return 'PROFESSIONAL'
    if (priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE) return 'ENTERPRISE'
    return 'FREE'
  }

  /**
   * Get credits for plan
   */
  private static getCreditsForPlan(plan: string, type: 'email' | 'sms' | 'ai'): number {
    const credits = {
      FREE: { email: 100, sms: 10, ai: 5 },
      STARTER: { email: 5000, sms: 500, ai: 100 },
      ELITE: { email: 25000, sms: 2500, ai: 500 },
      PROFESSIONAL: { email: 50000, sms: 5000, ai: 1000 },
      ENTERPRISE: { email: 500000, sms: 50000, ai: 10000 },
    }
    return credits[plan as keyof typeof credits]?.[type] || 0
  }

  /**
   * Add credits to subscription
   */
  static async addCredits(
    userId: string,
    type: 'email' | 'sms' | 'ai',
    amount: number
  ) {
    try {
      const fieldName = `${type}Credits`

      await prisma.subscription.update({
        where: { userId },
        data: {
          [fieldName]: {
            increment: amount,
          },
        },
      })

      return { success: true }
    } catch (error: any) {
      console.error('Add credits error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Deduct credits from subscription
   */
  static async deductCredits(
    userId: string,
    type: 'email' | 'sms' | 'ai',
    amount: number
  ) {
    try {
      const fieldName = `${type}Credits`
      const usedFieldName = `${type}Used`

      await prisma.subscription.update({
        where: { userId },
        data: {
          [fieldName]: {
            decrement: amount,
          },
          [usedFieldName]: {
            increment: amount,
          },
        },
      })

      return { success: true }
    } catch (error: any) {
      console.error('Deduct credits error:', error)
      return { success: false, error: error.message }
    }
  }
}
