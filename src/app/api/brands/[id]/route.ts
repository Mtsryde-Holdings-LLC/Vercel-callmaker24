import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBrandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  brandVoice: z
    .object({
      tone: z.string().optional(),
      personality: z.string().optional(),
      values: z.array(z.string()).optional(),
      writingStyle: z.string().optional(),
    })
    .optional(),
  targetAudience: z.string().optional().nullable(),
  contentPillars: z.array(z.string()).optional(),
  primaryColors: z.array(z.string()).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

// GET /api/brands/[id] - Get single brand
export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    const brand = await prisma.brand.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!brand) {
      return apiError('Brand not found', { status: 404, requestId });
    }

    return apiSuccess({ brand }, { requestId });
  },
  { route: 'GET /api/brands/[id]', rateLimit: RATE_LIMITS.standard }
);

// PATCH /api/brands/[id] - Update brand
export const PATCH = withApiHandler(
  async (_request: NextRequest, { organizationId, params, body, requestId }: ApiContext) => {
    const existingBrand = await prisma.brand.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingBrand) {
      return apiError('Brand not found', { status: 404, requestId });
    }

    const validatedData = body as z.infer<typeof updateBrandSchema>;

    const brand = await prisma.brand.update({
      where: { id: params.id },
      data: validatedData,
    });

    return apiSuccess({ brand }, { requestId });
  },
  {
    route: 'PATCH /api/brands/[id]',
    rateLimit: RATE_LIMITS.standard,
    bodySchema: updateBrandSchema,
  }
);

// DELETE /api/brands/[id] - Delete brand
export const DELETE = withApiHandler(
  async (_request: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    const existingBrand = await prisma.brand.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!existingBrand) {
      return apiError('Brand not found', { status: 404, requestId });
    }

    if (existingBrand._count.posts > 0) {
      return apiError(
        `Cannot delete brand with ${existingBrand._count.posts} existing posts. Delete posts first.`,
        { status: 400, requestId }
      );
    }

    await prisma.brand.delete({
      where: { id: params.id },
    });

    return apiSuccess({ message: 'Brand deleted successfully' }, { requestId });
  },
  { route: 'DELETE /api/brands/[id]', rateLimit: RATE_LIMITS.standard }
);
