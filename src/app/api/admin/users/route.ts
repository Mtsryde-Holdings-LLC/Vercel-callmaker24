import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import {
  hasPermission,
  canAddUser,
  SUBSCRIPTION_LIMITS,
} from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    const userId = session.user.id;

    let users;

    if (userRole === "SUPER_ADMIN") {
      // Super admin sees all users
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
      // Corporate admin sees users in their organization
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user?.organizationId) {
        return NextResponse.json(
          { error: "No organization found" },
          { status: 400 }
        );
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("[GET /api/admin/users] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    const userId = session.user.id;
    const body = await req.json();
    const { email, name, role, permissions } = body;

    // Validation
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, name, and role are required" },
        { status: 400 }
      );
    }

    // Check permissions
    if (userRole === "SUPER_ADMIN") {
      // Super admin can create any role
    } else if (userRole === "CORPORATE_ADMIN") {
      // Corporate admin can only create SUB_ADMIN and AGENT
      if (role !== "SUB_ADMIN" && role !== "AGENT") {
        return NextResponse.json(
          { error: "You can only create Sub Admins and Agents" },
          { status: 403 }
        );
      }

      // Check subscription limits
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
        return NextResponse.json(
          { error: "No organization found" },
          { status: 400 }
        );
      }

      const subscription = user.subscriptions[0];
      const limits = subscription
        ? SUBSCRIPTION_LIMITS[
            subscription.plan as keyof typeof SUBSCRIPTION_LIMITS
          ]
        : SUBSCRIPTION_LIMITS.FREE;

      // Count existing users of this role
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
        return NextResponse.json({ error: canAdd.reason }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get organization ID
    let organizationId = null;
    if (userRole === "CORPORATE_ADMIN") {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });
      organizationId = currentUser?.organizationId;
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role: role as UserRole,
        organizationId,
        assignedBy: userRole === "CORPORATE_ADMIN" ? userId : null,
        permissions: role === "SUB_ADMIN" ? permissions : null,
        emailVerified: new Date(), // Auto-verify for admin-created users
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

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/admin/users] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
