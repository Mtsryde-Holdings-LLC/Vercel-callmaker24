import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const accounts = await prisma.socialAccount.findMany({
      where: { userId: session.user.id, organizationId },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        isActive: true,
      },
    });

    const formattedAccounts = accounts.map((acc) => ({
      id: acc.id,
      platform: acc.platform,
      accountName: acc.displayName || acc.username || "Unknown",
      isActive: acc.isActive,
    }));

    return apiSuccess({ accounts: formattedAccounts }, { requestId });
  },
  { route: "GET /api/social/accounts" },
);
