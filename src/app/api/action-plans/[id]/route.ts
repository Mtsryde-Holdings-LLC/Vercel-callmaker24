import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { ActionPlanService } from "@/services/action-plan.service";

// GET /api/action-plans/[id] - Get a single action plan with segment details
export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    const plan = await ActionPlanService.getPlanById(params.id);
    if (!plan) {
      return apiError('Action plan not found', { status: 404, requestId });
    }
    if (plan.organizationId !== organizationId) {
      return apiError('Forbidden', { status: 403, requestId });
    }
    return apiSuccess(plan, { requestId });
  },
  { route: 'GET /api/action-plans/[id]', rateLimit: RATE_LIMITS.standard }
);

// PATCH /api/action-plans/[id] - Update plan status or an individual action's status
export const PATCH = withApiHandler(
  async (request: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    const plan = await ActionPlanService.getPlanById(params.id);
    if (!plan) {
      return apiError('Action plan not found', { status: 404, requestId });
    }
    if (plan.organizationId !== organizationId) {
      return apiError('Forbidden', { status: 403, requestId });
    }

    const body = await request.json();

    // Update single action
    if (body.actionId && body.actionStatus) {
      await ActionPlanService.updateActionStatus(
        params.id,
        body.actionId,
        body.actionStatus,
        body.campaignId,
      );
      return apiSuccess({ message: 'Action updated' }, { requestId });
    }

    // Update plan status
    if (body.status) {
      if (body.status === 'ACTIVE') {
        await ActionPlanService.activatePlan(params.id);
      } else if (body.status === 'PAUSED') {
        await ActionPlanService.pausePlan(params.id);
      }
      return apiSuccess({ message: `Plan ${body.status.toLowerCase()}` }, { requestId });
    }

    return apiError('No valid update provided', { status: 400, requestId });
  },
  { route: 'PATCH /api/action-plans/[id]', rateLimit: RATE_LIMITS.standard }
);

// DELETE /api/action-plans/[id] - Delete an action plan
export const DELETE = withApiHandler(
  async (_request: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    const plan = await ActionPlanService.getPlanById(params.id);
    if (!plan) {
      return apiError('Action plan not found', { status: 404, requestId });
    }
    if (plan.organizationId !== organizationId) {
      return apiError('Forbidden', { status: 403, requestId });
    }
    await ActionPlanService.deletePlan(params.id);
    return apiSuccess({ message: 'Plan deleted' }, { requestId });
  },
  { route: 'DELETE /api/action-plans/[id]', rateLimit: RATE_LIMITS.standard }
);
