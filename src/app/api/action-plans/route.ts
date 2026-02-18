import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { ActionPlanService } from "@/services/action-plan.service";

// GET /api/action-plans - List all action plans for the current organization
export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const plans = await ActionPlanService.getPlansForOrganization(organizationId);
    return apiSuccess(plans, { requestId });
  },
  { route: 'GET /api/action-plans', rateLimit: RATE_LIMITS.standard }
);

// POST /api/action-plans - Generate action plans from current segmentation results
export const POST = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { generated, updated } =
      await ActionPlanService.generateForOrganization(organizationId);

    return apiSuccess(
      {
        generated,
        updated,
        message: `Generated ${generated} new plans, updated ${updated} existing plans`,
      },
      { requestId }
    );
  },
  { route: 'POST /api/action-plans', rateLimit: RATE_LIMITS.standard }
);
