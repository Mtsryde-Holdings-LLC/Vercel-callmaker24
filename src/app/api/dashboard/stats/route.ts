import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    // Fetch stats filtered by organization
    const [customers, emailCampaigns, smsCampaigns, socialPosts] =
      await Promise.all([
        prisma.customer.count({
          where: { organizationId },
        }),
        prisma.emailCampaign.count({
          where: { organizationId },
        }),
        prisma.smsCampaign.count({
          where: { organizationId },
        }),
        prisma.post.count({
          where: { organizationId },
        }),
      ]);

    return apiSuccess(
      {
        customers,
        emailCampaigns,
        smsCampaigns,
        socialAccounts: socialPosts, // Use posts count for social accounts stat
      },
      { requestId },
    );
  },
  {
    route: "GET /api/dashboard/stats",
    rateLimit: RATE_LIMITS.standard,
  },
);
