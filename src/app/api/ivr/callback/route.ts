import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const POST = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await request.json();

    const callback = await prisma.callback.create({
      data: {
        customerPhone: body.phone,
        customerName: body.name,
        department: body.department,
        scheduledFor: new Date(body.scheduledFor),
        notes: body.notes,
        organizationId,
      },
    });

    return apiSuccess(callback, { requestId });
  },
  { route: "POST /api/ivr/callback" },
);

export const GET = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const callbacks = await prisma.callback.findMany({
      where: { organizationId },
      orderBy: { scheduledFor: "asc" },
    });

    return apiSuccess(callbacks, { requestId });
  },
  { route: "GET /api/ivr/callback" },
);
