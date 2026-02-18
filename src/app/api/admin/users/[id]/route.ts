import { NextRequest } from "next/server";
import { withAdminHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const PATCH = withAdminHandler(
  async (request: NextRequest, { session, params, requestId }: ApiContext) => {
    const userRole = session.user.role as UserRole;
    const userId = session.user.id;
    const targetUserId = params.id;
    const body = await request.json();
    const { role, permissions } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        organizationId: true,
        assignedBy: true,
      },
    });

    if (!targetUser) {
      return apiError("User not found", { status: 404, requestId });
    }

    if (userRole === "SUPER_ADMIN") {
      // Super admin can update anyone
    } else if (userRole === "CORPORATE_ADMIN") {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (targetUser.organizationId !== currentUser?.organizationId) {
        return apiError("Cannot update users from other organizations", {
          status: 403,
          requestId,
        });
      }

      if (
        targetUser.role === "CORPORATE_ADMIN" ||
        targetUser.role === "SUPER_ADMIN"
      ) {
        return apiError("Cannot update admin users", {
          status: 403,
          requestId,
        });
      }

      if (role === "CORPORATE_ADMIN" || role === "SUPER_ADMIN") {
        return apiError("Cannot promote users to admin roles", {
          status: 403,
          requestId,
        });
      }
    } else {
      return apiError("Forbidden", { status: 403, requestId });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(role && { role: role as UserRole }),
        ...(permissions !== undefined && { permissions }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        updatedAt: true,
      },
    });

    return apiSuccess({ user: updatedUser }, { requestId });
  },
  { route: "PATCH /api/admin/users/:id", requireOrg: false },
);

export const DELETE = withAdminHandler(
  async (request: NextRequest, { session, params, requestId }: ApiContext) => {
    const userRole = session.user.role as UserRole;
    const userId = session.user.id;
    const targetUserId = params.id;

    if (userId === targetUserId) {
      return apiError("Cannot delete your own account", {
        status: 400,
        requestId,
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        organizationId: true,
      },
    });

    if (!targetUser) {
      return apiError("User not found", { status: 404, requestId });
    }

    if (userRole === "SUPER_ADMIN") {
      if (targetUser.role === "SUPER_ADMIN") {
        return apiError("Cannot delete other super admins", {
          status: 403,
          requestId,
        });
      }
    } else if (userRole === "CORPORATE_ADMIN") {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (targetUser.organizationId !== currentUser?.organizationId) {
        return apiError("Cannot delete users from other organizations", {
          status: 403,
          requestId,
        });
      }

      if (
        targetUser.role === "CORPORATE_ADMIN" ||
        targetUser.role === "SUPER_ADMIN"
      ) {
        return apiError("Cannot delete admin users", {
          status: 403,
          requestId,
        });
      }
    } else {
      return apiError("Forbidden", { status: 403, requestId });
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return apiSuccess({ deleted: true }, { requestId });
  },
  { route: "DELETE /api/admin/users/:id", requireOrg: false },
);
