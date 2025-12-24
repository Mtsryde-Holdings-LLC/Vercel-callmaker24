import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/loyalty/rewards - List all available rewards
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const rewards = await prisma.redemptionReward.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
      orderBy: {
        pointsCost: "asc",
      },
    });

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}

// POST /api/loyalty/rewards - Create a new reward (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true },
    });

    // Only admins can create rewards
    if (!user || !["SUPER_ADMIN", "CORPORATE_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      pointsCost,
      type,
      discountPercent,
      discountAmount,
      freeItemValue,
      isSingleUse,
      expiryDays,
    } = body;

    if (!name || !pointsCost || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const reward = await prisma.redemptionReward.create({
      data: {
        name,
        description,
        pointsCost,
        type,
        discountPercent,
        discountAmount,
        freeItemValue,
        isSingleUse: isSingleUse ?? true,
        expiryDays,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    console.error("Error creating reward:", error);
    return NextResponse.json(
      { error: "Failed to create reward" },
      { status: 500 }
    );
  }
}

// PUT /api/loyalty/rewards?id=xxx - Update a reward (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true },
    });

    if (!user || !["SUPER_ADMIN", "CORPORATE_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rewardId = req.nextUrl.searchParams.get("id");
    if (!rewardId) {
      return NextResponse.json(
        { error: "Reward ID required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      pointsCost,
      type,
      discountPercent,
      discountAmount,
      freeItemValue,
      isActive,
      isSingleUse,
      expiryDays,
    } = body;

    const reward = await prisma.redemptionReward.update({
      where: { id: rewardId },
      data: {
        name,
        description,
        pointsCost,
        type,
        discountPercent,
        discountAmount,
        freeItemValue,
        isActive,
        isSingleUse,
        expiryDays,
      },
    });

    return NextResponse.json({ reward });
  } catch (error) {
    console.error("Error updating reward:", error);
    return NextResponse.json(
      { error: "Failed to update reward" },
      { status: 500 }
    );
  }
}

// DELETE /api/loyalty/rewards?id=xxx - Delete a reward (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true },
    });

    if (!user || !["SUPER_ADMIN", "CORPORATE_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rewardId = req.nextUrl.searchParams.get("id");
    if (!rewardId) {
      return NextResponse.json(
        { error: "Reward ID required" },
        { status: 400 }
      );
    }

    await prisma.redemptionReward.delete({
      where: { id: rewardId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reward:", error);
    return NextResponse.json(
      { error: "Failed to delete reward" },
      { status: 500 }
    );
  }
}
