import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

// GET /api/segments/[id] - Get segment details
export const GET = withApiHandler(
  async (
    request: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    const segment = await prisma.segment.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        customers: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            totalSpent: true,
            orderCount: true,
            engagementScore: true,
            rfmScore: true,
            churnRisk: true,
            segmentTags: true,
          },
          orderBy: { engagementScore: "desc" },
        },
        _count: {
          select: { customers: true },
        },
      },
    });

    if (!segment) {
      return apiError("Segment not found", { status: 404, requestId });
    }

    return apiSuccess(segment, { requestId });
  },
  { route: "GET /api/segments/[id]" },
);

// PUT /api/segments/[id] - Update segment
export const PUT = withApiHandler(
  async (
    request: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    const body = await request.json();
    const { name, description, conditions, autoUpdate } = body;

    const segment = await prisma.segment.updateMany({
      where: {
        id: params.id,
        organizationId,
      },
      data: {
        name,
        description,
        conditions,
        autoUpdate,
        updatedAt: new Date(),
      },
    });

    if (segment.count === 0) {
      return apiError("Segment not found", { status: 404, requestId });
    }

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "PUT /api/segments/[id]" },
);

// DELETE /api/segments/[id] - Delete segment
export const DELETE = withApiHandler(
  async (
    request: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    const segment = await prisma.segment.deleteMany({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (segment.count === 0) {
      return apiError("Segment not found", { status: 404, requestId });
    }

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "DELETE /api/segments/[id]" },
);
