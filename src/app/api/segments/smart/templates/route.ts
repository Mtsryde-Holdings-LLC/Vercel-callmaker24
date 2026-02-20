import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { SMART_SEGMENT_TEMPLATES } from "@/services/smart-segmentation.service";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/segments/smart/templates
 * Returns available smart segment templates + which ones are already active.
 */
export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    // Get existing segments for this org
    const existingSegments = await prisma.segment.findMany({
      where: { organizationId },
      select: { segmentType: true, id: true, customerCount: true },
    });

    const existingTypes = new Set(
      existingSegments.map((s) => s.segmentType).filter(Boolean) as string[],
    );

    const templates = SMART_SEGMENT_TEMPLATES.map((template) => ({
      ...template,
      isActive: existingTypes.has(template.segmentType),
      existingSegmentId:
        existingSegments.find((s) => s.segmentType === template.segmentType)
          ?.id || null,
      currentCustomerCount:
        existingSegments.find((s) => s.segmentType === template.segmentType)
          ?.customerCount || 0,
    }));

    return apiSuccess(
      {
        templates,
        totalTemplates: templates.length,
        activeCount: templates.filter((t) => t.isActive).length,
      },
      { requestId },
    );
  },
  { route: "GET /api/segments/smart/templates" },
);
