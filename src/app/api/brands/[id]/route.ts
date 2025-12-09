import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBrandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  brandVoice: z
    .object({
      tone: z.string().optional(),
      personality: z.string().optional(),
      values: z.array(z.string()).optional(),
      writingStyle: z.string().optional(),
    })
    .optional(),
  targetAudience: z.string().optional().nullable(),
  contentPillars: z.array(z.string()).optional(),
  primaryColors: z.array(z.string()).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

// GET /api/brands/[id] - Get single brand
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 }
      );
    }

    const brand = await prisma.brand.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error: any) {
    console.error("[Brand GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch brand" },
      { status: 500 }
    );
  }
}

// PATCH /api/brands/[id] - Update brand
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 }
      );
    }

    // Verify brand exists and belongs to organization
    const existingBrand = await prisma.brand.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    });

    if (!existingBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateBrandSchema.parse(body);

    const brand = await prisma.brand.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedByUserId: session.user.id,
      },
    });

    console.log("[Brand PATCH] Updated brand:", brand.name);

    return NextResponse.json({ brand });
  } catch (error: any) {
    console.error("[Brand PATCH] Error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update brand" },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id] - Delete brand
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 }
      );
    }

    // Verify brand exists and belongs to organization
    const existingBrand = await prisma.brand.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!existingBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check if brand has posts
    if (existingBrand._count.posts > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete brand with ${existingBrand._count.posts} existing posts. Delete posts first.`,
        },
        { status: 400 }
      );
    }

    await prisma.brand.delete({
      where: { id: params.id },
    });

    console.log("[Brand DELETE] Deleted brand:", existingBrand.name);

    return NextResponse.json({ message: "Brand deleted successfully" });
  } catch (error: any) {
    console.error("[Brand DELETE] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete brand" },
      { status: 500 }
    );
  }
}
