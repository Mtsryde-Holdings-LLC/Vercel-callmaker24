import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const POST = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { token, password } = await request.json();

    const user = await prisma.user.findFirst({
      where: {
        verificationCode: token,
        codeExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return apiError("Invalid or expired token", { status: 400, requestId });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        verificationCode: null,
        codeExpiry: null,
      },
    });

    return apiSuccess({ reset: true }, { requestId });
  },
  { route: "POST /api/auth/reset-password", rateLimit: RATE_LIMITS.auth },
);
