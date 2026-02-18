import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { SocialMediaService } from "@/services/social-media.service";

// GET /api/social/posts/[id] - Get post details
export const GET = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId, params }: ApiContext,
  ) => {
    const post = await prisma.socialPost.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!post) {
      return apiError("Post not found", { status: 404, requestId });
    }

    return apiSuccess(post, { requestId });
  },
  { route: "GET /api/social/posts/[id]" },
);

// PATCH /api/social/posts/[id] - Update a post
export const PATCH = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId, params }: ApiContext,
  ) => {
    const existingPost = await prisma.socialPost.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingPost) {
      return apiError("Post not found", { status: 404, requestId });
    }

    const body = await request.json();
    const post = await SocialMediaService.updatePost(params.id, body);

    return apiSuccess({ post }, { requestId });
  },
  { route: "PATCH /api/social/posts/[id]" },
);

// DELETE /api/social/posts/[id] - Delete a post
export const DELETE = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId, params }: ApiContext,
  ) => {
    const existingPost = await prisma.socialPost.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingPost) {
      return apiError("Post not found", { status: 404, requestId });
    }

    await SocialMediaService.deletePost(params.id);

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "DELETE /api/social/posts/[id]" },
);
