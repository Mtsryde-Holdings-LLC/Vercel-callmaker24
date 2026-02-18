import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(
  async (
    req: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    const campaign = await prisma.smsCampaign.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!campaign) {
      return apiError("Campaign not found", { status: 404, requestId });
    }

    return apiSuccess(campaign, { requestId });
  },
  { route: "GET /api/sms/campaigns/[id]" },
);

export const PATCH = withApiHandler(
  async (
    req: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    const body = await req.json();
    const { name, message } = body;

    const existing = await prisma.smsCampaign.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!existing) {
      return apiError("Campaign not found", { status: 404, requestId });
    }

    const campaign = await prisma.smsCampaign.update({
      where: { id: params.id },
      data: { name, message },
    });

    return apiSuccess(campaign, { requestId });
  },
  { route: "PATCH /api/sms/campaigns/[id]" },
);
