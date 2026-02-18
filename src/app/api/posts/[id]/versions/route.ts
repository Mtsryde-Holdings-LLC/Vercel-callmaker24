import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createVersionSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  mediaDescription: z.string().optional(),
  source: z.enum(["AI_GENERATED", "USER_EDITED"]).default("USER_EDITED"),
});

// POST /api/posts/[id]/versions - Create new version
export const POST = withApiHandler(
  async (
    req: NextRequest,
    { session, organizationId, params, requestId }: ApiContext,
  ) => {
    // Verify post exists and belongs to organization
    const post = await prisma.post.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!post) {
      return apiError("Post not found", { status: 404, requestId });
    }

    const body = await req.json();

    let validatedData;
    try {
      validatedData = createVersionSchema.parse(body);
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

    // Get latest version number
    const latestVersion = await prisma.postVersion.findFirst({
      where: { postId: params.id },
      orderBy: { versionNumber: "desc" },
    });

    const version = await prisma.postVersion.create({
      data: {
        postId: params.id,
        versionNumber: (latestVersion?.versionNumber || 0) + 1,
        caption: validatedData.caption,
        hashtags: validatedData.hashtags || [],
        mediaUrls: validatedData.mediaUrls || [],
        mediaDescription: validatedData.mediaDescription,
        source: validatedData.source,
        createdByUserId: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return apiSuccess({ version }, { status: 201, requestId });
  },
  { route: "POST /api/posts/[id]/versions" },
);
