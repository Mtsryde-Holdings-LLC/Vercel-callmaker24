import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { PaymentService } from '@/services/payment.service'
import { prisma } from '@/lib/prisma'

export const POST = withApiHandler(
  async (request: NextRequest, { session, organizationId, requestId }: ApiContext) => {
    const { priceId, paymentMethodId } = await request.json()

    if (!priceId) {
      return apiError('Price ID is required', { status: 400, requestId })
    }

    // ── Shopify App Store Billing Enforcement ─────────────────────────────
    // Merchants who installed via Shopify MUST use Shopify's Billing API.
    // Stripe checkout is blocked for these users per Shopify App Store policy.
    const shopifyIntegration = await prisma.integration.findUnique({
      where: {
        organizationId_platform: {
          organizationId,
          platform: 'SHOPIFY',
        },
      },
    })

    if (shopifyIntegration?.isActive) {
      return apiError(
        'Shopify merchants must subscribe through Shopify billing. ' +
        'Please use the Shopify billing flow on the subscription page.',
        { status: 403, requestId }
      )
    }

    // Also block if existing subscription is on Shopify  
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (existingSub?.billingProvider === 'shopify') {
      return apiError(
        'Your subscription is managed through Shopify. ' +
        'Please manage your billing through the Shopify admin.',
        { status: 403, requestId }
      )
    }

    // ── Stripe billing (non-Shopify users) ────────────────────────────────
    const result = await PaymentService.createSubscription(
      session.user.id,
      priceId,
      paymentMethodId
    )

    if (!result.success) {
      return apiError(result.error || 'Failed to create subscription', { status: 500, requestId })
    }

    return apiSuccess(result.data, { requestId })
  },
  { route: 'POST /api/create-subscription', rateLimit: RATE_LIMITS.standard }
)
