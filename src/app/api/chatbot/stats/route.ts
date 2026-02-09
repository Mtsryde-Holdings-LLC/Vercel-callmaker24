import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    const orgId = session.user.organizationId;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get real conversation count for today
    const conversationsToday = await prisma.chatConversation.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    // Get active intents count
    const activeIntents = await prisma.chatbotIntent.count({
      where: {
        organizationId: orgId,
        isActive: true,
      },
    });

    // Get average confidence from intents
    const intents = await prisma.chatbotIntent.findMany({
      where: { organizationId: orgId, isActive: true },
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

    // Get total conversations and resolved for response rate
    const totalConversations = await prisma.chatConversation.count({
      where: { organizationId: orgId },
    });
    const resolvedConversations = await prisma.chatConversation.count({
      where: { organizationId: orgId, status: { in: ["RESOLVED", "CLOSED"] } },
    });
    const responseRate =
      totalConversations > 0
        ? Math.round((resolvedConversations / totalConversations) * 100)
        : 0;

    return NextResponse.json({
      conversationsToday,
      activeIntents,
      avgConfidence,
      responseRate,
    });
  } catch (error) {
    console.error("Chatbot Stats GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
