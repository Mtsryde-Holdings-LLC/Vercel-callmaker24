import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

// GET /api/email/campaigns/:id
export const GET = withApiHandler(
  async (req: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!campaign) {
      return apiError("Campaign not found", { status: 404, requestId });
    }

    return apiSuccess(campaign, { requestId });
  },
  { route: "GET /api/email/campaigns/[id]" },
);

// PUT /api/email/campaigns/:id
export const PUT = withApiHandler(
  async (req: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    // Verify campaign belongs to user's organization
    const existingCampaign = await prisma.emailCampaign.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingCampaign) {
      return apiError("Campaign not found", { status: 404, requestId });
    }

    const body = await req.json();
    const campaign = await prisma.emailCampaign.update({
      where: { id: params.id },
      data: body,
    });

    return apiSuccess(campaign, { requestId });
  },
  { route: "PUT /api/email/campaigns/[id]" },
);

// DELETE /api/email/campaigns/:id
export const DELETE = withApiHandler(
  async (req: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    // Verify campaign belongs to user's organization
    const existingCampaign = await prisma.emailCampaign.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingCampaign) {
      return apiError("Campaign not found", { status: 404, requestId });
    }

    await prisma.emailCampaign.delete({
      where: { id: params.id },
    });

    return apiSuccess({ message: "Campaign deleted" }, { requestId });
  },
  { route: "DELETE /api/email/campaigns/[id]" },
);
