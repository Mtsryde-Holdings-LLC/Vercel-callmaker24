import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { aiService } from "@/lib/ai-service";
import { z } from "zod";

const generatePostsSchema = z.object({
  brandId: z.string(),
  platforms: z.array(
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
  goal: z.string(),
  contentPillar: z.string().optional(),
  productInfo: z.string().optional(),
  campaignTheme: z.string().optional(),
  numberOfVariations: z.number().min(1).max(10).default(3),
});

export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId, body }: ApiContext,
  ) => {
    const validatedData = body as z.infer<typeof generatePostsSchema>;

    // Get brand and verify ownership
    const brand = await prisma.brand.findFirst({
      where: {
        id: validatedData.brandId,
        organizationId,
      },
    });

    if (!brand) {
      return apiError("Brand not found", { status: 404, requestId });
    }

    // Generate posts for each platform
    const allPosts = [];

    for (const platform of validatedData.platforms) {
      try {
        const posts = await aiService.generatePosts({
          brandContext: {
            name: brand.name,
            voice: brand.brandVoice,
            targetAudience: brand.targetAudience || "General audience",
            description: brand.description || "",
          },
          platform,
          goal: validatedData.goal,
          contentPillar: validatedData.contentPillar,
          productInfo: validatedData.productInfo,
          campaignTheme: validatedData.campaignTheme,
          numberOfVariations: validatedData.numberOfVariations,
        });

        // Create Post records in database
        for (const postData of posts) {
          const post = await prisma.post.create({
            data: {
              organizationId,
              brandId: brand.id,
              platform,
              title: postData.caption.substring(0, 100) + "...",
              contentType: postData.contentType || "SINGLE_POST",
              status: "DRAFT",
              aiPromptUsed: JSON.stringify({
                goal: validatedData.goal,
                contentPillar: validatedData.contentPillar,
                productInfo: validatedData.productInfo,
                campaignTheme: validatedData.campaignTheme,
              }),
              createdByUserId: session.user.id,
              updatedByUserId: session.user.id,
            },
          });

          // Create initial version
          await prisma.postVersion.create({
            data: {
              postId: post.id,
              caption: postData.caption,
              hashtags: postData.hashtags || [],
              mediaUrls: postData.mediaDescription
                ? [postData.mediaDescription]
                : [],
              createdByUserId: session.user.id,
              source: "AI_GENERATED",
            },
          });

          allPosts.push({
            ...post,
            latestVersion: {
              caption: postData.caption,
              hashtags: postData.hashtags,
              mediaDescription: postData.mediaDescription,
            },
          });
        }
      } catch {
        // Continue with other platforms even if one fails
      }
    }

    return apiSuccess(
      {
        posts: allPosts,
        message: `Generated ${allPosts.length} post variations across ${validatedData.platforms.length} platforms`,
      },
      { requestId },
    );
  },
  {
    route: "POST /api/ai/generate-posts",
    rateLimit: RATE_LIMITS.ai,
    bodySchema: generatePostsSchema,
  },
);
