import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { awsConnectService } from "@/lib/aws-connect.service";

export const dynamic = "force-dynamic";

// GET /api/call-center/aws-connect/flows - Get AWS Connect Contact Flows (IVR Flows)
export const GET = withApiHandler(
  async (_request: NextRequest, { requestId }: ApiContext) => {
    if (!awsConnectService.isConfigured()) {
      return apiError('AWS Connect not configured', {
        status: 400,
        requestId,
        meta: { flows: [] },
      });
    }

    const flows = await awsConnectService.listContactFlows();

    return apiSuccess({
      flows: flows.map((flow) => ({
        id: flow.Id,
        arn: flow.Arn,
        name: flow.Name,
        type: flow.ContactFlowType,
        description: "",
      })),
    }, { requestId });
  },
  { route: 'GET /api/call-center/aws-connect/flows', rateLimit: RATE_LIMITS.standard }
);
