import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActionPlanService } from "@/services/action-plan.service";

/**
 * GET /api/action-plans/[id]
 * Get a single action plan with segment details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await ActionPlanService.getPlanById(params.id);
    if (!plan) {
      return NextResponse.json(
        { error: "Action plan not found" },
        { status: 404 },
      );
    }

    // Verify ownership
    if (plan.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error("[ACTION PLANS] Failed to fetch plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch action plan" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/action-plans/[id]
 * Update plan status or an individual action's status
 *
 * Body options:
 * - { status: "ACTIVE" | "PAUSED" | "COMPLETED" }  → update plan status
 * - { actionId, actionStatus, campaignId? }          → update single action
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await ActionPlanService.getPlanById(params.id);
    if (!plan) {
      return NextResponse.json(
        { error: "Action plan not found" },
        { status: 404 },
      );
    }
    if (plan.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Update single action
    if (body.actionId && body.actionStatus) {
      await ActionPlanService.updateActionStatus(
        params.id,
        body.actionId,
        body.actionStatus,
        body.campaignId,
      );
      return NextResponse.json({ success: true, message: "Action updated" });
    }

    // Update plan status
    if (body.status) {
      if (body.status === "ACTIVE") {
        await ActionPlanService.activatePlan(params.id);
      } else if (body.status === "PAUSED") {
        await ActionPlanService.pausePlan(params.id);
      }
      return NextResponse.json({
        success: true,
        message: `Plan ${body.status.toLowerCase()}`,
      });
    }

    return NextResponse.json(
      { error: "No valid update provided" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("[ACTION PLANS] Failed to update plan:", error);
    return NextResponse.json(
      { error: "Failed to update action plan", message: error.message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/action-plans/[id]
 * Delete an action plan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await ActionPlanService.getPlanById(params.id);
    if (!plan) {
      return NextResponse.json(
        { error: "Action plan not found" },
        { status: 404 },
      );
    }
    if (plan.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await ActionPlanService.deletePlan(params.id);
    return NextResponse.json({ success: true, message: "Plan deleted" });
  } catch (error: any) {
    console.error("[ACTION PLANS] Failed to delete plan:", error);
    return NextResponse.json(
      { error: "Failed to delete action plan" },
      { status: 500 },
    );
  }
}
