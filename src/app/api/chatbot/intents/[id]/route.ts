import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const PATCH = withApiHandler(
  async (req: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    const body = await req.json();
    const intent = await prisma.chatbotIntent.update({
      where: { id: params.id, organizationId },
      data: body,
    });

    return apiSuccess(intent, { requestId });
  },
  { route: 'PATCH /api/chatbot/intents/[id]', rateLimit: RATE_LIMITS.standard }
);

export const DELETE = withApiHandler(
  async (_req: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    await prisma.chatbotIntent.delete({
      where: { id: params.id, organizationId },
    });

    return apiSuccess({ success: true }, { requestId });
  },
  { route: 'DELETE /api/chatbot/intents/[id]', rateLimit: RATE_LIMITS.standard }
);
