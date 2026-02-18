import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  brandVoice: z
    .object({
      tone: z.string().optional(),
      personality: z.string().optional(),
      values: z.array(z.string()).optional(),
      writingStyle: z.string().optional(),
    })
    .optional(),
  targetAudience: z.string().optional(),
  contentPillars: z.array(z.string()).optional(),
  primaryColors: z.array(z.string()).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

// GET /api/brands - List all brands for the organization
export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const brands = await prisma.brand.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return apiSuccess({ brands }, { requestId });
  },
  { route: 'GET /api/brands', rateLimit: RATE_LIMITS.standard }
);

// POST /api/brands - Create a new brand
export const POST = withApiHandler(
  async (_request: NextRequest, { organizationId, body, requestId }: ApiContext) => {
    const validatedData = body as z.infer<typeof createBrandSchema>;

    const brand = await prisma.brand.create({
      data: {
        organizationId,
        name: validatedData.name,
        description: validatedData.description,
        brandVoice: validatedData.brandVoice || {},
        targetAudience: validatedData.targetAudience,
        contentPillars: validatedData.contentPillars || [],
        primaryColors: validatedData.primaryColors || [],
        logoUrl: validatedData.logoUrl,
      },
    });

    return apiSuccess({ brand }, { status: 201, requestId });
  },
  {
    route: 'POST /api/brands',
    rateLimit: RATE_LIMITS.standard,
    bodySchema: createBrandSchema,
  }
);
