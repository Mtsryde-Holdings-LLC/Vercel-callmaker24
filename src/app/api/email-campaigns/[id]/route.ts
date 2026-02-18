import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(
  async (
    req: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!campaign) {
      return apiError("Campaign not found", { status: 404, requestId });
    }

    return apiSuccess(campaign, { requestId });
  },
  { route: "GET /api/email-campaigns/[id]" },
);

export const PATCH = withApiHandler(
  async (
    req: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    const body = await req.json();
    const { name, subject, fromName, fromEmail, htmlContent } = body;

    const existing = await prisma.emailCampaign.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!existing) {
      return apiError("Campaign not found", { status: 404, requestId });
    }

    const campaign = await prisma.emailCampaign.update({
      where: { id: params.id },
      data: { name, subject, fromName, fromEmail, htmlContent },
    });

    return apiSuccess(campaign, { requestId });
  },
  { route: "PATCH /api/email-campaigns/[id]" },
);
