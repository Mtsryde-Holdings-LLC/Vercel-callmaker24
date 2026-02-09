import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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
    const intent = await prisma.chatbotIntent.update({
      where: { id: params.id, organizationId: session.user.organizationId },
      data: body,
    });

    return NextResponse.json(intent);
  } catch (error) {
    console.error("Chatbot Intent PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update intent" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    await prisma.chatbotIntent.delete({
      where: { id: params.id, organizationId: session.user.organizationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chatbot Intent DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete intent" },
      { status: 500 },
    );
  }
}
