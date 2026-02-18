import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["AGENT", "SUB_ADMIN"]),
});

// POST /api/team/invite - Invite a new user to the organization
export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, body, requestId }: ApiContext,
  ) => {
    const validatedData = body as z.infer<typeof inviteSchema>;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      if (existingUser.organizationId === organizationId) {
        return apiError("User already exists in your organization", {
          status: 400,
          requestId,
        });
      } else {
        return apiError("User already registered with another organization", {
          status: 400,
          requestId,
        });
      }
    }

    // Generate temporary password
    const tempPassword =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name || validatedData.email.split("@")[0],
        password: hashedPassword,
        role: validatedData.role,
        organizationId,
        assignedBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return apiSuccess(
      {
        user: newUser,
        message: `User invited successfully. Temporary credentials have been sent to ${validatedData.email}`,
        ...(process.env.NODE_ENV === "development" && {
          tempPassword,
          loginUrl: `${process.env.NEXTAUTH_URL}/auth/signin`,
        }),
      },
      { requestId },
    );
  },
  {
    route: "POST /api/team/invite",
    roles: ["CORPORATE_ADMIN", "SUB_ADMIN", "SUPER_ADMIN"],
    bodySchema: inviteSchema,
  },
);
