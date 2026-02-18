import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z
    .enum(["IDEA", "DRAFT", "APPROVED", "SCHEDULED", "POSTED", "ARCHIVED"])
    .optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  postedAt: z.string().datetime().optional().nullable(),
});

// GET /api/posts/[id] - Get single post
export const GET = withApiHandler(
  async (
    req: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    const post = await prisma.post.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        brand: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        performance: {
          orderBy: { recordedAt: "desc" },
        },
      } as any,
    });

    if (!post) {
      return apiError("Post not found", { status: 404, requestId });
    }

    return apiSuccess({ post }, { requestId });
  },
  { route: "GET /api/posts/[id]" },
);

// PATCH /api/posts/[id] - Update post
export const PATCH = withApiHandler(
  async (
    req: NextRequest,
    { session, organizationId, params, requestId }: ApiContext,
  ) => {
    // Verify post exists and belongs to organization
    const existingPost = await prisma.post.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingPost) {
      return apiError("Post not found", { status: 404, requestId });
    }

    const body = await req.json();

    let validatedData;
    try {
      validatedData = updatePostSchema.parse(body);
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

    // If marking as POSTED, set postedAt
    if (validatedData.status === "POSTED" && !validatedData.postedAt) {
      validatedData.postedAt = new Date().toISOString();
    }

    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedByUserId: session.user.id,
      },
      include: {
        brand: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    return apiSuccess({ post }, { requestId });
  },
  { route: "PATCH /api/posts/[id]" },
);

// DELETE /api/posts/[id] - Delete post
export const DELETE = withApiHandler(
  async (
    req: NextRequest,
    { organizationId, params, requestId }: ApiContext,
  ) => {
    // Verify post exists and belongs to organization
    const existingPost = await prisma.post.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingPost) {
      return apiError("Post not found", { status: 404, requestId });
    }

    // Delete all related data (cascade)
    await prisma.post.delete({
      where: { id: params.id },
    });

    return apiSuccess({ message: "Post deleted successfully" }, { requestId });
  },
  { route: "DELETE /api/posts/[id]" },
);
