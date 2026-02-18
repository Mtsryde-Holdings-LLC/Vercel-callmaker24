import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

// Super admin credentials - CHANGE THESE IN PRODUCTION!
const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL || "admin@callmaker24.com";
const SUPER_ADMIN_PASSWORD =
  process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!";
const SUPER_ADMIN_NAME = "Super Administrator";

/**
 * Super Admin Auto-Login Endpoint
 * Creates or updates super admin account and returns login credentials
 *
 * Usage: GET /api/auth/superadmin
 *
 * SECURITY: Only enable in development or protect with API key in production
 */
export const GET = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    // Security check - only allow in development or with secret key
    const isDevelopment = process.env.NODE_ENV === "development";
    const secretKey = request.headers.get("x-admin-secret");
    const validSecret =
      process.env.SUPER_ADMIN_SECRET || "change-this-secret-key";

    if (!isDevelopment && secretKey !== validSecret) {
      return apiError("Unauthorized access", { status: 401, requestId });
    }

    // Check if super admin exists
    let superAdmin = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
    });

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    if (superAdmin) {
      // Update existing super admin
      superAdmin = await prisma.user.update({
        where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
        data: {
          password: hashedPassword,
          role: "SUPER_ADMIN",
          emailVerified: new Date(),
          name: SUPER_ADMIN_NAME,
        },
      });
    } else {
      // Create new super admin
      superAdmin = await prisma.user.create({
        data: {
          email: SUPER_ADMIN_EMAIL.toLowerCase(),
          password: hashedPassword,
          name: SUPER_ADMIN_NAME,
          role: "SUPER_ADMIN",
          emailVerified: new Date(),
          authProvider: "EMAIL",
        },
      });
    }

    return apiSuccess(
      {
        message: "Super admin account ready",
        credentials: {
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD,
        },
        loginUrl: `${process.env.NEXTAUTH_URL || "https://callmaker24.com"}/auth/signin`,
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role,
        },
      },
      { requestId },
    );
  },
  { route: "GET /api/auth/superadmin", rateLimit: RATE_LIMITS.auth },
);

/**
 * Direct Login Endpoint - Auto-creates session
 * Usage: POST /api/auth/superadmin with { "autoLogin": true }
 */
export const POST = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const body = await request.json();
    const { autoLogin } = body;

    if (!autoLogin) {
      return apiError("Invalid request", { status: 400, requestId });
    }

    // Security check
    const isDevelopment = process.env.NODE_ENV === "development";
    const secretKey = request.headers.get("x-admin-secret");
    const validSecret =
      process.env.SUPER_ADMIN_SECRET || "change-this-secret-key";

    if (!isDevelopment && secretKey !== validSecret) {
      return apiError("Unauthorized access", { status: 401, requestId });
    }

    // Ensure super admin exists
    let superAdmin = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
    });

    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
      superAdmin = await prisma.user.create({
        data: {
          email: SUPER_ADMIN_EMAIL.toLowerCase(),
          password: hashedPassword,
          name: SUPER_ADMIN_NAME,
          role: "SUPER_ADMIN",
          emailVerified: new Date(),
          authProvider: "EMAIL",
        },
      });
    }

    return apiSuccess(
      {
        message: "Use these credentials to sign in",
        credentials: {
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD,
        },
        redirect: "/auth/signin",
      },
      { requestId },
    );
  },
  { route: "POST /api/auth/superadmin", rateLimit: RATE_LIMITS.auth },
);
