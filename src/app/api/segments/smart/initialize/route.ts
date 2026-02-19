import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SmartSegmentationService } from "@/services/smart-segmentation.service";

/**
 * POST /api/segments/smart/initialize
 * Initialize all pre-defined smart segment templates for the organization.
 * Creates AI-powered segments that auto-evaluate and update.
 */
export const POST = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const result =
      await SmartSegmentationService.initializeTemplates(organizationId);

    return apiSuccess(
      {
        ...result,
        message: `Created ${result.created} smart segments (${result.existing} already existed).`,
      },
      { status: 201, requestId },
    );
  },
  { route: "POST /api/segments/smart/initialize" },
);
