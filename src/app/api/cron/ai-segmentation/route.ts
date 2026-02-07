import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SegmentationService } from "@/services/segmentation.service";

/**
 * Cron Job: AI-Powered Customer Segmentation
 * Automatically recalculates RFM scores, engagement metrics, and segment assignments
 *
 * Runs daily to keep customer segments fresh and accurate
 * Schedule: Daily at 2 AM UTC
 */

export async function GET(req: NextRequest) {
  try {
    console.log("[AI SEGMENTATION] Starting segmentation job...");

    // Verify authorization
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error("[AI SEGMENTATION] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    console.log(
      `[AI SEGMENTATION] Processing ${organizations.length} organizations`
    );

    const results = [];

    for (const org of organizations) {
      try {
        console.log(`[AI SEGMENTATION] Processing organization: ${org.name}`);

        // Step 1: Recalculate all customer metrics
        const { processed, failed } =
          await SegmentationService.recalculateAllCustomers(org.id);

        console.log(
          `[AI SEGMENTATION] ${org.name}: Processed ${processed} customers, ${failed} failed`
        );

        // Step 2: Auto-assign customers to AI segments
        await SegmentationService.assignToSegments(org.id);

        console.log(`[AI SEGMENTATION] ${org.name}: Segments updated`);

        results.push({
          organizationId: org.id,
          organizationName: org.name,
          processed,
          failed,
          success: true,
        });
      } catch (error: any) {
        console.error(`[AI SEGMENTATION] Error processing ${org.name}:`, error);
        results.push({
          organizationId: org.id,
          organizationName: org.name,
          error: error.message,
          success: false,
        });
      }
    }

    const summary = {
      success: true,
      organizationsProcessed: organizations.length,
      totalCustomersProcessed: results.reduce(
        (sum, r) => sum + (r.processed || 0),
        0
      ),
      totalFailed: results.reduce((sum, r) => sum + (r.failed || 0), 0),
      results,
      timestamp: new Date().toISOString(),
    };

    console.log("[AI SEGMENTATION] Job completed:", summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("[AI SEGMENTATION] Job failed:", error);
    return NextResponse.json(
      {
        error: "AI segmentation failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
