import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  brandVoice: z
    .object({
      tone: z.string().optional(),
      personality: z.string().optional(),
      values: z.array(z.string()).optional(),
      writingStyle: z.string().optional(),
    })
    .optional(),
  targetAudience: z.string().optional(),
  contentPillars: z.array(z.string()).optional(),
  primaryColors: z.array(z.string()).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

// GET /api/brands - List all brands for the organization
export async function GET(req: NextRequest) {
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

    const brands = await prisma.brand.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json({ brands });
  } catch (error: any) {
    console.error("[Brands GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

// POST /api/brands - Create a new brand
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const validatedData = createBrandSchema.parse(body);

    const brand = await prisma.brand.create({
      data: {
        organizationId: user.organizationId,
        name: validatedData.name,
        description: validatedData.description,
        brandVoice: validatedData.brandVoice || {},
        targetAudience: validatedData.targetAudience,
        contentPillars: validatedData.contentPillars || [],
        primaryColors: validatedData.primaryColors || [],
        logoUrl: validatedData.logoUrl,
        createdByUserId: session.user.id,
        updatedByUserId: session.user.id,
      },
    });

    console.log("[Brands POST] Created brand:", brand.name);

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: any) {
    console.error("[Brands POST] Error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create brand" },
      { status: 500 }
    );
  }
}
