import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const templates = await prisma.smsTemplate.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(templates, { requestId });
  },
  { route: "GET /api/sms/templates" },
);

export const POST = withApiHandler(
  async (
    req: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const body = await req.json();
    const { name, category, description, message, emoji, tags } = body;

    const template = await prisma.smsTemplate.create({
      data: {
        name,
        category,
        description,
        message,
        emoji: emoji || "",
        tags: tags || [],
        organizationId,
        createdById: session.user.id,
      },
    });

    return apiSuccess(template, { requestId });
  },
  { route: "POST /api/sms/templates" },
);
