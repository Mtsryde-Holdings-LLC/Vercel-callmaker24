import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { aiService } from "@/lib/ai-service";
import { z } from "zod";

const repurposeSchema = z.object({
  postId: z.string().optional(),
  sourceText: z.string().min(1),
  targetPlatforms: z.array(
    z.enum([
      "INSTAGRAM",
      "FACEBOOK",
      "TWITTER_X",
      "LINKEDIN",
      "TIKTOK",
      "YOUTUBE_SHORTS",
      "OTHER",
    ]),
  ),
  targetFormat: z
    .enum([
      "SINGLE_POST",
      "CAROUSEL",
      "REEL",
      "VIDEO",
      "STORY",
      "THREAD",
      "OTHER",
    ])
    .optional(),
  brandId: z.string().optional(),
});

export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId, body }: ApiContext,
  ) => {
    const validatedData = body as z.infer<typeof repurposeSchema>;

    // Get brand voice if brandId provided
    let brandVoice: string | undefined = undefined;
    if (validatedData.brandId) {
      const brand = await prisma.brand.findFirst({
        where: {
          id: validatedData.brandId,
          organizationId,
        },
        select: { brandVoice: true },
      });
      brandVoice = (brand?.brandVoice as string | undefined) ?? "";
    }

    // Repurpose for each platform
    const repurposedContent = [];

    for (const platform of validatedData.targetPlatforms) {
      try {
        const adaptedText = await aiService.repurposeContent({
          sourceText: validatedData.sourceText,
          targetPlatform: platform,
          targetFormat: validatedData.targetFormat ?? "SINGLE_POST",
          brandVoice: brandVoice ?? "",
        });

        // If postId provided, create new versions for existing post
        if (validatedData.postId) {
          const post = await prisma.post.findFirst({
            where: {
              id: validatedData.postId,
              organizationId,
            },
          });

          if (post) {
            await prisma.postVersion.create({
              data: {
                postId: post.id,
                caption: adaptedText,
                hashtags: [],
                mediaUrls: [],
                createdByUserId: session.user.id,
                source: "AI_GENERATED",
              },
            });
          }
        }

        repurposedContent.push({
          platform,
          content: adaptedText,
        });
      } catch {
        repurposedContent.push({
          platform,
          content: null,
          error: "Failed to repurpose for this platform",
        });
      }
    }

    return apiSuccess(
      {
        repurposed: repurposedContent,
        message: `Repurposed content for ${validatedData.targetPlatforms.length} platforms`,
      },
      { requestId },
    );
  },
  {
    route: "POST /api/ai/repurpose",
    rateLimit: RATE_LIMITS.ai,
    bodySchema: repurposeSchema,
  },
);
