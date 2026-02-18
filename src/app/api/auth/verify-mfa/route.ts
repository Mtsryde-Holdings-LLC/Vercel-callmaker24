import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/notifications";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const POST = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { email, code } = await request.json();

    if (!email || !code) {
      return apiError("Email and verification code are required", {
        status: 400,
        requestId,
      });
    }

    // Find user with pending verification
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return apiError("User not found", { status: 404, requestId });
    }

    // Check if code matches and hasn't expired
    const storedCode = user.verificationCode;
    const codeExpiry = user.codeExpiry;

    if (!storedCode || !codeExpiry) {
      return apiError("No verification code found for this account", {
        status: 400,
        requestId,
      });
    }

    if (new Date() > codeExpiry) {
      return apiError(
        "Verification code has expired. Please request a new one.",
        { status: 400, requestId },
      );
    }

    if (storedCode !== code) {
      return apiError("Invalid verification code", { status: 400, requestId });
    }

    // Verify user and clear verification code
    const verifiedUser = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        emailVerified: new Date(),
        verificationCode: null,
        codeExpiry: null,
      },
    });

    // Send welcome email (non-blocking)
    if (verifiedUser.name && verifiedUser.email) {
      sendWelcomeEmail(verifiedUser.email, verifiedUser.name).catch(() => {});
    }

    return apiSuccess(
      { message: "Account verified successfully" },
      { requestId },
    );
  },
  { route: "POST /api/auth/verify-mfa", rateLimit: RATE_LIMITS.auth },
);
