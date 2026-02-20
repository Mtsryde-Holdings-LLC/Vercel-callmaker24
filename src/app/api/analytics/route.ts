import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS } from "@/lib/rate-limit";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Generate date labels for the requested period
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );
    }

    // ---- Email Stats ----
    const [emailCampaigns, emailMessages] = await Promise.all([
      prisma.emailCampaign.findMany({
        where: { organizationId, createdAt: { gte: sinceDate } },
        select: {
          deliveredCount: true,
          openedCount: true,
          clickedCount: true,
          bouncedCount: true,
          totalRecipients: true,
        },
      }),
      prisma.emailMessage.count({
        where: {
          organizationId,
          createdAt: { gte: sinceDate },
        },
      }),
    ]);

    const totalEmailSent =
      emailCampaigns.reduce((sum, c) => sum + c.totalRecipients, 0) ||
      emailMessages;
    const totalEmailDelivered = emailCampaigns.reduce(
      (sum, c) => sum + c.deliveredCount,
      0,
    );
    const totalEmailOpened = emailCampaigns.reduce(
      (sum, c) => sum + c.openedCount,
      0,
    );
    const totalEmailClicked = emailCampaigns.reduce(
      (sum, c) => sum + c.clickedCount,
      0,
    );
    const totalEmailBounced = emailCampaigns.reduce(
      (sum, c) => sum + c.bouncedCount,
      0,
    );

    // ---- SMS Stats ----
    const smsCampaigns = await prisma.smsCampaign.findMany({
      where: { organizationId, createdAt: { gte: sinceDate } },
      select: {
        totalRecipients: true,
        deliveredCount: true,
        failedCount: true,
        repliedCount: true,
        optOutCount: true,
      },
    });

    const totalSmsSent = smsCampaigns.reduce(
      (sum, c) => sum + c.totalRecipients,
      0,
    );
    const totalSmsDelivered = smsCampaigns.reduce(
      (sum, c) => sum + c.deliveredCount,
      0,
    );
    const totalSmsReplied = smsCampaigns.reduce(
      (sum, c) => sum + c.repliedCount,
      0,
    );

    // ---- IVR Stats ----
    const ivrCampaigns = await prisma.ivrCampaign.findMany({
      where: { organizationId, createdAt: { gte: sinceDate } },
      select: {
        totalCalls: true,
        completedCalls: true,
        failedCalls: true,
      },
    });

    const totalIvrCalls = ivrCampaigns.reduce(
      (sum, c) => sum + c.totalCalls,
      0,
    );
    const completedIvrCalls = ivrCampaigns.reduce(
      (sum, c) => sum + c.completedCalls,
      0,
    );

    // ---- Social Stats ----
    const [totalPosts, publishedPosts] = await Promise.all([
      prisma.socialPost.count({
        where: { organizationId, createdAt: { gte: sinceDate } },
      }),
      prisma.socialPost.count({
        where: {
          organizationId,
          status: "PUBLISHED",
          createdAt: { gte: sinceDate },
        },
      }),
    ]);

    // ---- Customer Stats ----
    const [totalCustomers, activeCustomers, newCustomers] = await Promise.all([
      prisma.customer.count({ where: { organizationId } }),
      prisma.customer.count({
        where: { organizationId, status: "ACTIVE" },
      }),
      prisma.customer.count({
        where: { organizationId, createdAt: { gte: sinceDate } },
      }),
    ]);

    // ---- Order Stats ----
    const orders = await prisma.order.aggregate({
      where: { organizationId, createdAt: { gte: sinceDate } },
      _sum: { total: true },
      _count: true,
    });

    // Helper for safe rate calc
    const rate = (num: number, den: number) =>
      den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : 0;

    return apiSuccess(
      {
        emailStats: {
          totalSent: totalEmailSent,
          openRate: rate(totalEmailOpened, totalEmailDelivered),
          clickRate: rate(totalEmailClicked, totalEmailDelivered),
          bounceRate: rate(totalEmailBounced, totalEmailSent),
        },
        smsStats: {
          totalSent: totalSmsSent,
          deliveryRate: rate(totalSmsDelivered, totalSmsSent),
          responseRate: rate(totalSmsReplied, totalSmsDelivered),
        },
        callStats: {
          totalCalls: totalIvrCalls,
          successRate: rate(completedIvrCalls, totalIvrCalls),
          completedCalls: completedIvrCalls,
        },
        socialStats: {
          totalPosts,
          publishedPosts,
        },
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          new: newCustomers,
        },
        revenue: {
          total: orders._sum.total || 0,
          orderCount: orders._count || 0,
        },
        trends: {
          dates,
        },
        period: {
          days,
          since: sinceDate.toISOString(),
        },
      },
      { requestId },
    );
  },
  {
    route: "GET /api/analytics",
    rateLimit: RATE_LIMITS.standard,
  },
);
