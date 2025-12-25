import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Sync Campaign Metrics
 *
 * Recalculates campaign metrics from actual message data.
 * Useful for fixing any discrepancies or getting real-time data.
 *
 * POST /api/sms-campaigns/:id/sync-metrics
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    // Verify campaign exists and belongs to user's org
    const campaign = await prisma.smsCampaign.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get all messages for this campaign
    const messages = await prisma.smsMessage.findMany({
      where: { campaignId: campaign.id },
      select: { status: true },
    });

    // Calculate metrics
    const totalRecipients = messages.length;
    const deliveredCount = messages.filter(
      (m) => m.status === "DELIVERED"
    ).length;
    const failedCount = messages.filter(
      (m) => m.status === "FAILED" || m.status === "UNDELIVERED"
    ).length;
    const repliedCount = messages.filter((m) => m.status === "REPLIED").length;
    const optOutCount = messages.filter((m) => m.status === "OPT_OUT").length;

    // Update campaign
    await prisma.smsCampaign.update({
      where: { id: campaign.id },
      data: {
        totalRecipients,
        deliveredCount,
        failedCount,
        repliedCount,
        optOutCount,
      },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalRecipients,
        deliveredCount,
        failedCount,
        repliedCount,
        optOutCount,
        deliveryRate:
          totalRecipients > 0
            ? ((deliveredCount / totalRecipients) * 100).toFixed(1) + "%"
            : "0%",
      },
    });
  } catch (error: any) {
    console.error("Sync metrics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
