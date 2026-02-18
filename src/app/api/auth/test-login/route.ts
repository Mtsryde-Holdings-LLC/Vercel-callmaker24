import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Simple login test endpoint
 * Returns user info if credentials are valid
 */
export const POST = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { email, password } = await request.json();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return apiError("User not found", { status: 404, requestId });
    }

    // Check password
    if (!user.password) {
      return apiError("No password set", { status: 400, requestId });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return apiError("Invalid password", { status: 401, requestId });
    }

    return apiSuccess(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        message: "Credentials are valid. You can now sign in.",
      },
      { requestId },
    );
  },
  { route: "POST /api/auth/test-login", rateLimit: RATE_LIMITS.auth },
);

/**
 * Check current session
 */
export const GET = withPublicApiHandler(
  async (_request: NextRequest, { requestId }: ApiContext) => {
    const session = await getServerSession(authOptions);

    if (!session) {
      return apiSuccess(
        {
          authenticated: false,
          message: "No active session",
        },
        { requestId },
      );
    }

    return apiSuccess(
      {
        authenticated: true,
        session,
        message: "Active session found",
      },
      { requestId },
    );
  },
  { route: "GET /api/auth/test-login", rateLimit: RATE_LIMITS.auth },
);
