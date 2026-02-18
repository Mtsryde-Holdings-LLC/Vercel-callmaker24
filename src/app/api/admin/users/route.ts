import { NextRequest } from "next/server";
import { withAdminHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { canAddUser, SUBSCRIPTION_LIMITS } from "@/lib/permissions";

export const GET = withAdminHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const userRole = session.user.role as UserRole;
    const userId = session.user.id;

    let users;

    if (userRole === "SUPER_ADMIN") {
      users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          organizationId: true,
          organization: { select: { name: true } },
          assignedBy: true,
          permissions: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (userRole === "CORPORATE_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user?.organizationId) {
        return apiError("No organization found", { status: 400, requestId });
      }

      users = await prisma.user.findMany({
        where: { organizationId: user.organizationId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          assignedBy: true,
          permissions: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return apiError("Forbidden", { status: 403, requestId });
    }

    return apiSuccess({ users }, { requestId });
  },
  { route: "GET /api/admin/users", requireOrg: false },
);

export const POST = withAdminHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const userRole = session.user.role as UserRole;
    const userId = session.user.id;
    const body = await request.json();
    const { email, name, role, permissions } = body;

    if (!email || !name || !role) {
      return apiError("Email, name, and role are required", {
        status: 400,
        requestId,
      });
    }

    if (userRole === "SUPER_ADMIN") {
      // Super admin can create any role
    } else if (userRole === "CORPORATE_ADMIN") {
      if (role !== "SUB_ADMIN" && role !== "AGENT") {
        return apiError("You can only create Sub Admins and Agents", {
          status: 403,
          requestId,
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          organization: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!user?.organization) {
        return apiError("No organization found", { status: 400, requestId });
      }

      const subscription = user.subscriptions[0];
      const limits = subscription
        ? SUBSCRIPTION_LIMITS[
            subscription.plan as keyof typeof SUBSCRIPTION_LIMITS
          ]
        : SUBSCRIPTION_LIMITS.FREE;

      const roleCount = await prisma.user.count({
        where: {
          organizationId: user.organizationId,
          role: role as UserRole,
        },
      });

      const maxAllowed =
        role === "SUB_ADMIN" ? limits.maxSubAdmins : limits.maxAgents;
      const canAdd = canAddUser(roleCount, maxAllowed, role as UserRole);

      if (!canAdd.allowed) {
        return apiError(canAdd.reason || "Limit reached", {
          status: 403,
          requestId,
        });
      }
    } else {
      return apiError("Forbidden", { status: 403, requestId });
    }

    let organizationId = null;
    if (userRole === "CORPORATE_ADMIN") {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });
      organizationId = currentUser?.organizationId;
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role: role as UserRole,
        organizationId,
        assignedBy: userRole === "CORPORATE_ADMIN" ? userId : null,
        permissions: role === "SUB_ADMIN" ? permissions : null,
        emailVerified: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        permissions: true,
      },
    });

    return apiSuccess({ user: newUser }, { status: 201, requestId });
  },
  { route: "POST /api/admin/users", requireOrg: false },
);
