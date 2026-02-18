import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiBadRequest } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

// GET /api/segments - List all segments
export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const segments = await prisma.segment.findMany({
      where: { organizationId },
      include: {
        customers: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            totalSpent: true,
            engagementScore: true,
          },
          take: 10,
        },
        _count: {
          select: { customers: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return apiSuccess(segments, { requestId });
  },
  { route: "GET /api/segments", rateLimit: RATE_LIMITS.standard }
);

// POST /api/segments - Create a new segment
export const POST = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await request.json();
    const {
      name,
      description,
      conditions,
      segmentType,
      isAiPowered,
      autoUpdate,
    } = body;

    if (!name) {
      return apiBadRequest("Name is required", requestId);
    }

    const segment = await prisma.segment.create({
      data: {
        name,
        description,
        conditions: conditions || {},
        segmentType,
        isAiPowered: isAiPowered || false,
        autoUpdate: autoUpdate !== false,
        organizationId,
      },
    });

    return apiSuccess(segment, { status: 201, requestId });
  },
  { route: "POST /api/segments", rateLimit: RATE_LIMITS.standard }
);
