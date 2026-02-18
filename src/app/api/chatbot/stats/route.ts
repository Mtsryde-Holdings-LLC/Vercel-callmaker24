import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (_req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const conversationsToday = await prisma.chatConversation.count({
      where: {
        organizationId,
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    const activeIntents = await prisma.chatbotIntent.count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    const intents = await prisma.chatbotIntent.findMany({
      where: { organizationId, isActive: true },
      select: { confidence: true },
    });
    const avgConfidence =
      intents.length > 0
        ? Math.round(
            (intents.reduce((sum, i) => sum + i.confidence, 0) /
              intents.length) *
              100,
          )
        : 0;

    const totalConversations = await prisma.chatConversation.count({
      where: { organizationId },
    });
    const resolvedConversations = await prisma.chatConversation.count({
      where: { organizationId, status: { in: ["RESOLVED", "CLOSED"] } },
    });
    const responseRate =
      totalConversations > 0
        ? Math.round((resolvedConversations / totalConversations) * 100)
        : 0;

    return apiSuccess(
      {
        conversationsToday,
        activeIntents,
        avgConfidence,
        responseRate,
      },
      { requestId },
    );
  },
  { route: "GET /api/chatbot/stats", rateLimit: RATE_LIMITS.standard },
);
