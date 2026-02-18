import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(
  async (_req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const intents = await prisma.chatbotIntent.findMany({
      where: { organizationId },
      orderBy: { priority: "desc" },
    });

    return apiSuccess(intents, { requestId });
  },
  { route: 'GET /api/chatbot/intents', rateLimit: RATE_LIMITS.standard }
);

export const POST = withApiHandler(
  async (req: NextRequest, { session, organizationId, requestId }: ApiContext) => {
    const body = await req.json();
    const { name, examples, response, confidence, priority, isActive } = body;

    const intent = await prisma.chatbotIntent.create({
      data: {
        name,
        examples: examples || [],
        response,
        confidence: confidence || 0.0,
        priority: priority || 0,
        isActive: isActive !== undefined ? isActive : true,
        organizationId,
        createdById: session.user.id,
      },
    });

    return apiSuccess(intent, { requestId });
  },
  { route: 'POST /api/chatbot/intents', rateLimit: RATE_LIMITS.standard }
);
