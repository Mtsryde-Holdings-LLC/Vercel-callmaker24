import { NextRequest } from 'next/server';
import { withApiHandler, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export const GET = withApiHandler(
  async (request: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        tags: true,
        _count: {
          select: {
            emailMessages: true,
            smsMessages: true,
            calls: true,
            orders: true,
          },
        },
      },
    });

    if (!customer) {
      return apiError('Customer not found', { status: 404, requestId });
    }

    return apiSuccess(customer, { requestId });
  },
  {
    route: 'GET /api/customers/[id]',
    rateLimit: RATE_LIMITS.standard,
  }
);

async function handleUpdate(request: NextRequest, { organizationId, params, requestId }: ApiContext) {
  const body = await request.json();

  // Verify customer belongs to user's organization
  const existing = await prisma.customer.findFirst({
    where: {
      id: params.id,
      organizationId,
    },
  });

  if (!existing) {
    return apiError('Customer not found', { status: 404, requestId });
  }

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: body,
    include: {
      tags: true,
    },
  });

  return apiSuccess(customer, { requestId });
}

export const PUT = withApiHandler(handleUpdate, {
  route: 'PUT /api/customers/[id]',
  rateLimit: RATE_LIMITS.standard,
});

export const PATCH = withApiHandler(handleUpdate, {
  route: 'PATCH /api/customers/[id]',
  rateLimit: RATE_LIMITS.standard,
});

export const DELETE = withApiHandler(
  async (request: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    // Verify customer belongs to user's organization before deletion
    const existing = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existing) {
      return apiError('Customer not found', { status: 404, requestId });
    }

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return apiSuccess({ message: 'Customer deleted' }, { requestId });
  },
  {
    route: 'DELETE /api/customers/[id]',
    rateLimit: RATE_LIMITS.standard,
  }
);
