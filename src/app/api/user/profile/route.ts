import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return apiError("User not found", { status: 404, requestId });
    }

    return apiSuccess(user, { requestId });
  },
  { route: "GET /api/user/profile" },
);

export const PUT = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const { name, email } = await request.json();

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name || undefined,
        email: email || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });

    return apiSuccess(user, { requestId });
  },
  { route: "PUT /api/user/profile" },
);
