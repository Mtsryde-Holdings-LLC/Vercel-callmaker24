import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { SocialMediaService } from "@/services/social-media.service";

// DELETE /api/social/accounts/[id] - Disconnect social account
export const DELETE = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId, params }: ApiContext,
  ) => {
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingAccount) {
      return apiError("Account not found", { status: 404, requestId });
    }

    await SocialMediaService.disconnectAccount(params.id);

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "DELETE /api/social/accounts/[id]" },
);

// POST /api/social/accounts/[id]/refresh - Refresh access token
export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId, params }: ApiContext,
  ) => {
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingAccount) {
      return apiError("Account not found", { status: 404, requestId });
    }

    const account = await SocialMediaService.refreshAccessToken(params.id);

    return apiSuccess({ account }, { requestId });
  },
  { route: "POST /api/social/accounts/[id]" },
);
