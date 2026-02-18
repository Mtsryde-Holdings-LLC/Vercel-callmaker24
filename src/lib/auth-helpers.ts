import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { UserRole } from "@prisma/client";
import { hasPermission } from "./permissions";

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role as UserRole)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return session;
}

export async function requirePermission(permission: string) {
  const session = await requireAuth();
  const userRole = session.user.role as UserRole;

  // Get custom permissions for sub-admins from database if needed
  let customPermissions: Record<string, boolean> | undefined = undefined;
  if (userRole === "SUB_ADMIN") {
    // TODO: Fetch from database in actual implementation
    customPermissions = undefined;
  }

  if (!hasPermission(userRole, permission, customPermissions)) {
    throw new Error(`Forbidden: Missing permission '${permission}'`);
  }

  return session;
}

// Wrapper for API routes
export function withAuth(handler: Function) {
  return async (req: Request) => {
    try {
      await requireAuth();
      return handler(req);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 },
      );
    }
  };
}

export function withRole(allowedRoles: UserRole[], handler: Function) {
  return async (req: Request) => {
    try {
      await requireRole(allowedRoles);
      return handler(req);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Unauthorized") ? 401 : 403 },
      );
    }
  };
}

export function withPermission(permission: string, handler: Function) {
  return async (req: Request) => {
    try {
      await requirePermission(permission);
      return handler(req);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Unauthorized") ? 401 : 403 },
      );
    }
  };
}
