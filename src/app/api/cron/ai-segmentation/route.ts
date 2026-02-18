import { NextRequest } from "next/server";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { SegmentationService } from "@/services/segmentation.service";
import { ActionPlanService } from "@/services/action-plan.service";

export const dynamic = "force-dynamic";

/**
 * Cron Job: AI-Powered Customer Segmentation
 * Automatically recalculates RFM scores, engagement metrics, and segment assignments
 *
 * Runs daily to keep customer segments fresh and accurate
 * Schedule: Daily at 2 AM UTC
 */

export const GET = withWebhookHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return apiUnauthorized(requestId);
    }

    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    const results = [];

    for (const org of organizations) {
      try {
        const { processed, failed } =
          await SegmentationService.recalculateAllCustomers(org.id);

        await SegmentationService.assignToSegments(org.id);

        const { generated: plansGenerated, updated: plansUpdated } =
          await ActionPlanService.generateForOrganization(org.id);

        results.push({
          organizationId: org.id,
          organizationName: org.name,
          processed,
          failed,
          plansGenerated,
          plansUpdated,
          success: true,
        });
      } catch (error: any) {
        results.push({
          organizationId: org.id,
          organizationName: org.name,
          error: "Processing failed",
          success: false,
        });
      }
    }

    return apiSuccess(
      {
        organizationsProcessed: organizations.length,
        totalCustomersProcessed: results.reduce(
          (sum, r) => sum + (r.processed || 0),
          0,
        ),
        totalFailed: results.reduce((sum, r) => sum + (r.failed || 0), 0),
        results,
        timestamp: new Date().toISOString(),
      },
      { requestId },
    );
  },
  { route: "GET /api/cron/ai-segmentation" },
);
