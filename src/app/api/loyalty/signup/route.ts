import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";

export const POST = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const body = await request.json();
    const { firstName, lastName, email, phone, birthday, orgSlug } = body;

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!org) {
      return apiError("Organization not found", { status: 404, requestId });
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email, organizationId: org.id },
          { phone, organizationId: org.id },
        ],
      },
    });

    if (existingCustomer) {
      await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          loyaltyMember: true,
          loyaltyTier: "BRONZE",
          birthday: birthday ? new Date(birthday) : null,
        },
      });
    } else {
      const firstUser = await prisma.user.findFirst({
        where: { organizationId: org.id },
      });

      await prisma.customer.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          birthday: birthday ? new Date(birthday) : null,
          loyaltyMember: true,
          loyaltyTier: "BRONZE",
          organizationId: org.id,
          createdById: firstUser?.id || "",
        },
      });
    }

    return apiSuccess({ enrolled: true }, { requestId });
  },
  { route: "POST /api/loyalty/signup" },
);
