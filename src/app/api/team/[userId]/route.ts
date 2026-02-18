import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

// DELETE /api/team/[userId] - Remove a user from the organization
export const DELETE = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, params, requestId }: ApiContext,
  ) => {
    const { userId } = params;

    // Cannot remove yourself
    if (userId === session.user.id) {
      return apiError("Cannot remove yourself", { status: 400, requestId });
    }

    // Get the user to verify they're in the same organization
    const userToRemove = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!userToRemove) {
      return apiError("User not found", { status: 404, requestId });
    }

    if (userToRemove.organizationId !== organizationId) {
      return apiError("User not in your organization", {
        status: 403,
        requestId,
      });
    }

    // SUB_ADMIN cannot remove ADMIN or other SUB_ADMIN
    if (session.user.role === "SUB_ADMIN" && userToRemove.role !== "AGENT") {
      return apiError("Cannot remove users with equal or higher role", {
        status: 403,
        requestId,
      });
    }

    // Remove organizationId instead of deleting the user (soft removal)
    await prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: null,
        assignedBy: null,
      },
    });

    return apiSuccess(
      {
        message: "User removed from organization successfully",
      },
      { requestId },
    );
  },
  {
    route: "DELETE /api/team/[userId]",
    roles: ["CORPORATE_ADMIN", "SUB_ADMIN", "SUPER_ADMIN"],
  },
);
