import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "ALL";

    // Fetch Email Campaign Reports
    const emailCampaigns =
      type === "ALL" || type === "EMAIL"
        ? await prisma.emailCampaign.findMany({
            where: { organizationId },
            select: {
              id: true,
              name: true,
              subject: true,
              status: true,
              createdAt: true,
              _count: {
                select: {
                  messages: true,
                },
              },
              messages: {
                select: {
                  status: true,
                  openedAt: true,
                  clicked: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        : [];

    // Fetch SMS Campaign Reports
    const smsCampaigns =
      type === "ALL" || type === "SMS"
        ? await prisma.smsCampaign.findMany({
            where: { organizationId },
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
              totalRecipients: true,
              deliveredCount: true,
              failedCount: true,
              repliedCount: true,
              optOutCount: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : [];

    // Fetch IVR Campaign Reports
    const ivrCampaigns =
      type === "ALL" || type === "IVR"
        ? await prisma.ivrCampaign.findMany({
            where: { organizationId },
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
              totalCalls: true,
              completedCalls: true,
              failedCalls: true,
              responses: {
                select: {
                  id: true,
                  callDuration: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        : [];

    // Fetch Social Media Campaign Reports
    const socialCampaigns =
      type === "ALL" || type === "SOCIAL"
        ? await prisma.socialPost.findMany({
            where: { organizationId },
            select: {
              id: true,
              content: true,
              status: true,
              platform: true,
              scheduledFor: true,
              createdAt: true,
              metadata: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : [];

    // Transform Email Reports
    const emailReports = emailCampaigns.map((campaign) => {
      const sent = campaign._count.messages;
      const delivered = campaign.messages.filter(
        (m: any) => m.status === "DELIVERED" || m.status === "OPENED",
      ).length;
      const opened = campaign.messages.filter((m: any) => m.openedAt).length;
      const clicked = campaign.messages.filter((m: any) => m.clicked).length;
      const bounced = campaign.messages.filter(
        (m: any) => m.status === "BOUNCED",
      ).length;
      const failed = campaign.messages.filter(
        (m: any) => m.status === "FAILED",
      ).length;
      const unsubscribed = 0; // TODO: Track unsubscribes

      return {
        id: campaign.id,
        name: campaign.name,
        type: "EMAIL",
        status: campaign.status,
        createdAt: campaign.createdAt,
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed,
        failed,
      };
    });

    // Transform SMS Reports - Calculate from actual messages
    const smsReports = await Promise.all(
      smsCampaigns.map(async (campaign) => {
        // Get actual message counts for accurate real-time metrics
        const messages = await prisma.smsMessage.findMany({
          where: { campaignId: campaign.id },
          select: { status: true },
        });

        const sent = messages.length || campaign.totalRecipients;
        const delivered = messages.filter(
          (m) => m.status === "DELIVERED",
        ).length;
        const failed = messages.filter(
          (m) => m.status === "FAILED" || m.status === "UNDELIVERED",
        ).length;
        const replied = messages.filter((m) => m.status === "REPLIED").length;
        const optedOut = messages.filter((m) => m.status === "OPT_OUT").length;

        return {
          id: campaign.id,
          name: campaign.name,
          type: "SMS",
          status: campaign.status,
          createdAt: campaign.createdAt,
          sent,
          delivered,
          opened: replied, // Use replied as "engagement"
          clicked: 0, // SMS click tracking would need link shortener
          bounced: failed,
          unsubscribed: optedOut,
          failed,
        };
      }),
    );

    // Transform IVR Reports
    const ivrReports = ivrCampaigns.map((campaign) => {
      const sent = campaign.totalCalls;
      const delivered = campaign.completedCalls;
      const failed = campaign.failedCalls;
      // Consider calls with duration > 10 seconds as "engaged"
      const engaged = campaign.responses.filter(
        (r) => r.callDuration && r.callDuration > 10,
      ).length;

      return {
        id: campaign.id,
        name: campaign.name,
        type: "IVR",
        status: campaign.status,
        createdAt: campaign.createdAt,
        sent,
        delivered,
        opened: engaged, // Calls answered and engaged
        clicked: campaign.responses.length, // Total responses collected
        bounced: failed,
        unsubscribed: 0,
        failed,
      };
    });

    // Transform Social Media Reports
    const socialReports = socialCampaigns.map((post) => {
      const metadata = (post.metadata as any) || {};

      return {
        id: post.id,
        name: `${post.platform} Post`,
        type: "SOCIAL",
        status: post.status,
        createdAt: post.createdAt,
        sent: 1,
        delivered: post.status === "PUBLISHED" ? 1 : 0,
        opened: metadata.impressions || 0,
        clicked: metadata.clicks || 0,
        bounced: 0,
        unsubscribed: 0,
        failed: post.status === "FAILED" ? 1 : 0,
      };
    });

    // Combine all reports
    const allReports = [
      ...emailReports,
      ...smsReports,
      ...ivrReports,
      ...socialReports,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return apiSuccess({ reports: allReports }, { requestId });
  },
  { route: "GET /api/reports/campaigns" },
);
