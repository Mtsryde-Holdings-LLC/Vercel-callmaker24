import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
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

// GET /api/posts - List posts with filters
export const GET = withApiHandler(
  async (
    req: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      organizationId,
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
          orderBy: { createdAt: "desc" },
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

    return apiSuccess({ posts }, { requestId });
  },
  { route: "GET /api/posts" },
);

// POST /api/posts - Create a new post
export const POST = withApiHandler(
  async (
    req: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const body = await req.json();

    let validatedData;
    try {
      validatedData = createPostSchema.parse(body);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return apiError("Invalid request data", {
          status: 400,
          meta: { details: error.errors },
          requestId,
        });
      }
      throw error;
    }

    // Verify brand ownership
    const brand = await prisma.brand.findFirst({
      where: {
        id: validatedData.brandId,
        organizationId,
      },
    });

    if (!brand) {
      return apiError("Brand not found", { status: 404, requestId });
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        organizationId,
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

    return apiSuccess({ post: postWithVersion }, { status: 201, requestId });
  },
  { route: "POST /api/posts" },
);
