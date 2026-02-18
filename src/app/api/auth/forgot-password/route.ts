import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

export const POST = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { email } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiSuccess({ sent: true }, { requestId });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { email },
      data: {
        verificationCode: token,
        codeExpiry: expiry,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject: "Reset Your Password",
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
      });
    } catch {
      // Email send failure is non-critical
    }

    return apiSuccess({ sent: true, resetUrl }, { requestId });
  },
  { route: "POST /api/auth/forgot-password", rateLimit: RATE_LIMITS.auth },
);
