import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    let orgId = session?.user?.organizationId;

    // Fallback: lookup user by email if organizationId missing
    if (!orgId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { organizationId: true },
      });
      orgId = user?.organizationId;
    }

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "ALL";

    // Fetch Email Campaign Reports
    const emailCampaigns =
      type === "ALL" || type === "EMAIL"
        ? await prisma.emailCampaign.findMany({
            where: { organizationId: orgId },
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
                  opened: true,
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
            where: { organizationId: orgId },
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
            where: { organizationId: orgId },
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
            where: { organizationId: orgId },
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
        (m) => m.status === "DELIVERED" || m.status === "OPENED"
      ).length;
      const opened = campaign.messages.filter((m) => m.opened).length;
      const clicked = campaign.messages.filter((m) => m.clicked).length;
      const bounced = campaign.messages.filter(
        (m) => m.status === "BOUNCED"
      ).length;
      const failed = campaign.messages.filter(
        (m) => m.status === "FAILED"
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

    // Transform SMS Reports
    const smsReports = smsCampaigns.map((campaign) => {
      const sent = campaign.totalRecipients;
      const delivered = campaign.deliveredCount;
      const failed = campaign.failedCount;

      return {
        id: campaign.id,
        name: campaign.name,
        type: "SMS",
        status: campaign.status,
        createdAt: campaign.createdAt,
        sent,
        delivered,
        opened: campaign.repliedCount, // Use replied as "engagement"
        clicked: 0, // SMS click tracking would need link shortener
        bounced: failed,
        unsubscribed: campaign.optOutCount,
        failed,
      };
    });

    // Transform IVR Reports
    const ivrReports = ivrCampaigns.map((campaign) => {
      const sent = campaign.totalCalls;
      const delivered = campaign.completedCalls;
      const failed = campaign.failedCalls;
      // Consider calls with duration > 10 seconds as "engaged"
      const engaged = campaign.responses.filter(
        (r) => r.callDuration && r.callDuration > 10
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
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      reports: allReports,
    });
  } catch (error) {
    console.error("Campaign reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
