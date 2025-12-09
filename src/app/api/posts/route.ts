import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPostSchema = z.object({
  brandId: z.string(),
  platform: z.enum([
    "INSTAGRAM",
    "FACEBOOK",
    "TWITTER_X",
    "LINKEDIN",
    "TIKTOK",
    "YOUTUBE",
    "YOUTUBE_SHORTS",
    "OTHER",
  ]),
  title: z.string().min(1).max(200),
  contentType: z
    .enum([
      "SINGLE_POST",
      "CAROUSEL",
      "REEL",
      "VIDEO",
      "STORY",
      "THREAD",
      "OTHER",
    ])
    .default("SINGLE_POST"),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  mediaDescription: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z
    .enum(["IDEA", "DRAFT", "APPROVED", "SCHEDULED", "POSTED", "ARCHIVED"])
    .optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  postedAt: z.string().datetime().optional().nullable(),
});

// GET /api/posts - List posts with filters
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

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      organizationId: user.organizationId,
    };

    if (brandId) where.brandId = brandId;
    if (status) where.status = status;
    if (platform) where.platform = platform;

    const posts = await prisma.post.findMany({
      where,
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        _count: {
          select: {
            versions: true,
            performance: true,
          },
        },
      },
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error("[Posts GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
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
    const validatedData = createPostSchema.parse(body);

    // Verify brand ownership
    const brand = await prisma.brand.findFirst({
      where: {
        id: validatedData.brandId,
        organizationId: user.organizationId,
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        organizationId: user.organizationId,
        brandId: validatedData.brandId,
        platform: validatedData.platform,
        title: validatedData.title,
        contentType: validatedData.contentType,
        status: validatedData.scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: validatedData.scheduledAt,
        createdByUserId: session.user.id,
        updatedByUserId: session.user.id,
      },
    });

    // Create initial version if caption provided
    if (validatedData.caption) {
      await prisma.postVersion.create({
        data: {
          postId: post.id,
          caption: validatedData.caption,
          hashtags: validatedData.hashtags || [],
          mediaDescription: validatedData.mediaDescription,
          createdByUserId: session.user.id,
          source: "USER_EDITED",
        },
      });
    }

    const postWithVersion = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        brand: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    console.log("[Posts POST] Created post:", post.title);

    return NextResponse.json({ post: postWithVersion }, { status: 201 });
  } catch (error: any) {
    console.error("[Posts POST] Error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
