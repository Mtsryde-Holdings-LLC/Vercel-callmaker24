import { NextRequest } from "next/server";
import { withAdminHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const POST = withAdminHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const body = await request.json();
    const { email, secretKey } = body;

    const SETUP_SECRET = process.env.SUPER_ADMIN_SETUP_KEY;

    if (!SETUP_SECRET || secretKey !== SETUP_SECRET) {
      return apiError("Invalid setup key", { status: 403, requestId });
    }

    if (!email) {
      return apiError("Email is required", { status: 400, requestId });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: "SUPER_ADMIN" },
        select: { id: true, email: true, name: true, role: true },
      });

      return apiSuccess(
        {
          message: "User upgraded to Super Admin",
          user: updatedUser,
        },
        { requestId },
      );
    } else {
      return apiError("User not found. Please register first.", {
        status: 404,
        requestId,
      });
    }
  },
  { route: "POST /api/admin/setup-super-admin" },
);
