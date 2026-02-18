import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { SegmentationService } from "@/services/segmentation.service";
import { ActionPlanService } from "@/services/action-plan.service";

/**
 * POST /api/segments/recalculate
 * Manually trigger AI segmentation recalculation for the current organization.
 * Normally this runs daily at 2 AM UTC via the cron job, but this lets admins
 * trigger it on-demand from the dashboard.
 */
export const POST = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    // Step 1: Recalculate all customer RFM, engagement, churn risk metrics
    const { processed, failed } =
      await SegmentationService.recalculateAllCustomers(organizationId);

    // Step 2: Auto-assign customers to AI-powered segments
    await SegmentationService.assignToSegments(organizationId);

    // Step 3: Auto-generate action plans based on segment results
    const { generated: plansGenerated, updated: plansUpdated } =
      await ActionPlanService.generateForOrganization(organizationId);

    return apiSuccess(
      {
        processed,
        failed,
        plansGenerated,
        plansUpdated,
        message: `Successfully recalculated segmentation for ${processed} customers. Generated ${plansGenerated} new action plans, updated ${plansUpdated}.`,
      },
      { requestId },
    );
  },
  { route: "POST /api/segments/recalculate" },
);
