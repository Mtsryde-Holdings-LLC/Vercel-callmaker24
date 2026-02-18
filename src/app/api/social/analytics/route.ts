import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SocialMediaService } from "@/services/social-media.service";

// GET /api/social/analytics - Get social media analytics
export const GET = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!accountId || !startDate || !endDate) {
      return apiError("Missing required parameters", {
        status: 400,
        requestId,
      });
    }

    const analytics = await SocialMediaService.getAccountAnalytics(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );

    return apiSuccess({ analytics }, { requestId });
  },
  { route: "GET /api/social/analytics" },
);

// POST /api/social/analytics/sync - Sync analytics from platforms
export const POST = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return apiError("Missing accountId", { status: 400, requestId });
    }

    const analytics = await SocialMediaService.syncAccountAnalytics(accountId);

    return apiSuccess({ analytics }, { requestId });
  },
  { route: "POST /api/social/analytics" },
);
