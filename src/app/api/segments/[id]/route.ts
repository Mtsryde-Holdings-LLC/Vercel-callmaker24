import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/segments/[id] - Get segment details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const segment = await prisma.segment.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        customers: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            totalSpent: true,
            orderCount: true,
            engagementScore: true,
            rfmScore: true,
            churnRisk: true,
            segmentTags: true,
          },
          orderBy: { engagementScore: "desc" },
        },
        _count: {
          select: { customers: true },
        },
      },
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: segment });
  } catch (error) {
    console.error("Get segment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment" },
      { status: 500 }
    );
  }
}

// PUT /api/segments/[id] - Update segment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, conditions, autoUpdate } = body;

    const segment = await prisma.segment.updateMany({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        name,
        description,
        conditions,
        autoUpdate,
        updatedAt: new Date(),
      },
    });

    if (segment.count === 0) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update segment error:", error);
    return NextResponse.json(
      { error: "Failed to update segment" },
      { status: 500 }
    );
  }
}

// DELETE /api/segments/[id] - Delete segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const segment = await prisma.segment.deleteMany({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (segment.count === 0) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete segment error:", error);
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 }
    );
  }
}
