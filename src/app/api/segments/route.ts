import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SegmentationService } from "@/services/segmentation.service";

// GET /api/segments - List all segments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const segments = await prisma.segment.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        customers: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            totalSpent: true,
            engagementScore: true,
          },
          take: 10, // Preview of first 10 customers
        },
        _count: {
          select: { customers: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: segments });
  } catch (error) {
    console.error("Get segments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments" },
      { status: 500 }
    );
  }
}

// POST /api/segments - Create a new segment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      conditions,
      segmentType,
      isAiPowered,
      autoUpdate,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const segment = await prisma.segment.create({
      data: {
        name,
        description,
        conditions: conditions || {},
        segmentType,
        isAiPowered: isAiPowered || false,
        autoUpdate: autoUpdate !== false, // Default true
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ success: true, data: segment }, { status: 201 });
  } catch (error) {
    console.error("Create segment error:", error);
    return NextResponse.json(
      { error: "Failed to create segment" },
      { status: 500 }
    );
  }
}
