import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SegmentationService } from "@/services/segmentation.service";

/**
 * POST /api/segments/recalculate
 * Manually trigger AI segmentation recalculation for the current organization.
 * Normally this runs daily at 2 AM UTC via the cron job, but this lets admins
 * trigger it on-demand from the dashboard.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    console.log(
      `[AI SEGMENTATION] Manual recalculation triggered for org ${organizationId}`,
    );

    // Step 1: Recalculate all customer RFM, engagement, churn risk metrics
    const { processed, failed } =
      await SegmentationService.recalculateAllCustomers(organizationId);

    // Step 2: Auto-assign customers to AI-powered segments
    await SegmentationService.assignToSegments(organizationId);

    console.log(
      `[AI SEGMENTATION] Manual recalculation complete: ${processed} processed, ${failed} failed`,
    );

    return NextResponse.json({
      success: true,
      processed,
      failed,
      message: `Successfully recalculated segmentation for ${processed} customers`,
    });
  } catch (error: any) {
    console.error("[AI SEGMENTATION] Manual recalculation failed:", error);
    return NextResponse.json(
      { error: "Recalculation failed", message: error.message },
      { status: 500 },
    );
  }
}
