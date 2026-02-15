import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActionPlanService } from "@/services/action-plan.service";

/**
 * GET /api/action-plans
 * List all action plans for the current organization
 */
export async function GET(request: NextRequest) {
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

    const plans = await ActionPlanService.getPlansForOrganization(
      organizationId,
    );
    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("[ACTION PLANS] Failed to fetch:", error);
    return NextResponse.json(
      { error: "Failed to fetch action plans" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/action-plans
 * Generate action plans from current segmentation results
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
      `[ACTION PLANS] Generating action plans for org ${organizationId}`,
    );

    const { generated, updated } =
      await ActionPlanService.generateForOrganization(organizationId);

    console.log(
      `[ACTION PLANS] Done: ${generated} generated, ${updated} updated`,
    );

    return NextResponse.json({
      success: true,
      generated,
      updated,
      message: `Generated ${generated} new plans, updated ${updated} existing plans`,
    });
  } catch (error: any) {
    console.error("[ACTION PLANS] Generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate action plans", message: error.message },
      { status: 500 },
    );
  }
}
