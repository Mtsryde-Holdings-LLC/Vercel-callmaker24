import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { SmartSegmentationService } from "@/services/smart-segmentation.service";

/**
 * POST /api/segments/smart/evaluate
 * Trigger AI evaluation of all auto-update segments for the organization.
 * Re-matches customers to segments based on current conditions, updates counts,
 * and optionally runs AI insight generation.
 */
export const POST = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    // Step 1: Recalculate enhanced LTV for all customers
    const metricsResult =
      await SmartSegmentationService.recalculateEnhancedMetrics(organizationId);

    // Step 2: Evaluate all auto-update segments
    const evalResult =
      await SmartSegmentationService.evaluateAllSegments(organizationId);

    return apiSuccess(
      {
        customersUpdated: metricsResult.updated,
        segmentsEvaluated: evalResult.evaluated,
        totalCustomersSegmented: evalResult.totalCustomersSegmented,
        segments: evalResult.results,
        message: `Updated ${metricsResult.updated} customer metrics, evaluated ${evalResult.evaluated} segments.`,
      },
      { requestId },
    );
  },
  { route: "POST /api/segments/smart/evaluate" },
);
