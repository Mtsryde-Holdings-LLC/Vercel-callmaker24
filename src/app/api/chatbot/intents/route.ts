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

    const intents = await prisma.chatbotIntent.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { priority: "desc" },
    });

    return NextResponse.json(intents);
  } catch (error) {
    console.error("Chatbot Intents GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch intents" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { name, examples, response, confidence, priority } = body;

    const intent = await prisma.chatbotIntent.create({
      data: {
        name,
        examples: examples || [],
        response,
        confidence: confidence || 0.0,
        priority: priority || 0,
        organizationId: session.user.organizationId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(intent);
  } catch (error) {
    console.error("Chatbot Intents POST error:", error);
    return NextResponse.json(
      { error: "Failed to create intent" },
      { status: 500 },
    );
  }
}
