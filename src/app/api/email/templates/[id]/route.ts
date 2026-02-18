import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const PATCH = withApiHandler(
  async (
    req: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    const body = await req.json();
    const template = await prisma.emailTemplate.update({
      where: { id: params.id, organizationId },
      data: body,
    });

    return apiSuccess(template, { requestId });
  },
  { route: "PATCH /api/email/templates/[id]" },
);

export const DELETE = withApiHandler(
  async (
    req: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    await prisma.emailTemplate.delete({
      where: { id: params.id, organizationId },
    });

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "DELETE /api/email/templates/[id]" },
);
