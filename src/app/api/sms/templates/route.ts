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

    const templates = await prisma.smsTemplate.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("SMS Templates GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
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
    const { name, category, description, message, emoji, tags } = body;

    const template = await prisma.smsTemplate.create({
      data: {
        name,
        category,
        description,
        message,
        emoji: emoji || "",
        tags: tags || [],
        organizationId: session.user.organizationId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("SMS Templates POST error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 },
    );
  }
}
