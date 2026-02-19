import { NextRequest } from 'next/server';
import { withApiHandler, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export const GET = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');

    if (platform) {
      const integration = await prisma.integration.findFirst({
        where: {
          organizationId,
          platform,
        },
      });

      // Include synced counts for Shopify
      let syncedCounts = null;
      if (platform === 'SHOPIFY' && integration) {
        const [customerCount, orderCount] = await Promise.all([
          prisma.customer.count({
            where: { organizationId, source: 'SHOPIFY' },
          }),
          prisma.order.count({
            where: { organizationId, source: 'SHOPIFY' },
          }),
        ]);
        syncedCounts = { customers: customerCount, orders: orderCount, products: 0 };
      }

      return apiSuccess({ integration, syncedCounts }, { requestId });
    }

    const integrations = await prisma.integration.findMany({
      where: { organizationId },
    });
    return apiSuccess({ integrations }, { requestId });
  },
  { route: 'GET /api/integrations', rateLimit: RATE_LIMITS.standard }
);

export const DELETE = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');

    if (!platform) {
      return apiError('Platform required', { status: 400, requestId });
    }

    await prisma.integration.deleteMany({
      where: {
        organizationId,
        platform,
      },
    });

    return apiSuccess({ success: true }, { requestId });
  },
  { route: 'DELETE /api/integrations', rateLimit: RATE_LIMITS.standard }
);
