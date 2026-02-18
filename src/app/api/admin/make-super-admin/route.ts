import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const SUPER_ADMIN_VERIFICATION_CODE = process.env.SUPER_ADMIN_CODE || "";
const ADMIN_EMAIL = "emmanuel.o@mtsryde.com";

export const POST = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const body = await request.json();
    const { verificationCode } = body;

    if (!verificationCode) {
      return apiError("Verification code required", { status: 400, requestId });
    }

    if (verificationCode !== SUPER_ADMIN_VERIFICATION_CODE) {
      return apiError("Invalid verification code", { status: 403, requestId });
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { role: "SUPER_ADMIN" },
    });

    return apiSuccess(
      {
        message: `User ${user.email} is now SUPER_ADMIN`,
        user: { id: user.id, email: user.email, role: user.role },
      },
      { requestId },
    );
  },
  { route: "POST /api/admin/make-super-admin", requireOrg: false },
);
