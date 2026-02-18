import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendVerificationEmail,
  sendVerificationSMS,
} from "@/lib/notifications";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const POST = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { email, method } = await request.json();

    if (!email) {
      return apiError("Email is required", { status: 400, requestId });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return apiError("User not found", { status: 404, requestId });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new code
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        verificationCode,
        codeExpiry,
      },
    });

    // Send code based on method
    if (method === "sms" && user.phone) {
      await sendVerificationSMS(user.phone, verificationCode);
    } else if (user.email) {
      await sendVerificationEmail(
        user.email,
        verificationCode,
        user.name || undefined,
      );
    } else {
      return apiError("No email or phone available for sending code", {
        status: 400,
        requestId,
      });
    }

    return apiSuccess(
      { message: "Verification code sent successfully" },
      { requestId },
    );
  },
  { route: "POST /api/auth/resend-mfa", rateLimit: RATE_LIMITS.auth },
);
