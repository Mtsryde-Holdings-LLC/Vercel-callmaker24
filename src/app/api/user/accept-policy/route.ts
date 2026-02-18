import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/**
 * Accept policy endpoint
 * Marks user as having accepted the acceptable use policy
 */
export const POST = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        policyAccepted: true,
        policyAcceptedAt: new Date(),
      },
    });

    return apiSuccess(
      {
        message: "Policy accepted successfully",
      },
      { requestId },
    );
  },
  { route: "POST /api/user/accept-policy" },
);

/**
 * Check policy acceptance status
 */
export const GET = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        policyAccepted: true,
        policyAcceptedAt: true,
      },
    });

    return apiSuccess(
      {
        accepted: user?.policyAccepted || false,
        acceptedAt: user?.policyAcceptedAt,
      },
      { requestId },
    );
  },
  { route: "GET /api/user/accept-policy" },
);
