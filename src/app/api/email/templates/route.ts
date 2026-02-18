import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const templates = await prisma.emailTemplate.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(templates, { requestId });
  },
  { route: "GET /api/email/templates" },
);

export const POST = withApiHandler(
  async (
    req: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const body = await req.json();
    const {
      name,
      category,
      description,
      thumbnail,
      subject,
      preheader,
      content,
      isPremium,
    } = body;

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        category,
        description,
        thumbnail: thumbnail || "",
        subject,
        preheader: preheader || "",
        content,
        isPremium: isPremium || false,
        organizationId,
        createdById: session.user.id,
      },
    });

    return apiSuccess(template, { requestId });
  },
  { route: "POST /api/email/templates" },
);
