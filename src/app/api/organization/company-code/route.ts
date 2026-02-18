import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const POST = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { companyCode } = await request.json();

    if (!/^\d{4}$/.test(companyCode)) {
      return apiError("Company code must be 4 digits", {
        status: 400,
        requestId,
      });
    }

    const existing = await prisma.organization.findFirst({
      where: {
        companyCode,
        id: { not: organizationId },
      },
    });

    if (existing) {
      return apiError("Company code already in use", {
        status: 400,
        requestId,
      });
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { companyCode },
    });

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "POST /api/organization/company-code" },
);
