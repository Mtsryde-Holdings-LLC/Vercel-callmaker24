import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { aiService } from "@/lib/ai-service";
import { z } from "zod";

const generateIdeasSchema = z.object({
  brandId: z.string(),
  numberOfIdeas: z.number().min(1).max(50).default(10),
  timeframe: z.enum(["WEEK", "MONTH", "QUARTER"]).default("WEEK"),
  focusAreas: z.array(z.string()).optional(),
  includeImages: z.boolean().default(false),
});

export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId, body }: ApiContext,
  ) => {
    const validatedData = body as z.infer<typeof generateIdeasSchema>;

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

    // Generate content ideas
    const ideas = await aiService.generateIdeas({
      brandContext: {
        name: brand.name,
        voice: brand.brandVoice,
        targetAudience: brand.targetAudience || "General audience",
        description: brand.description || "",
      },
      contentPillars: brand.contentPillars || [],
      numberOfIdeas: validatedData.numberOfIdeas,
      timeframe: validatedData.timeframe,
    });

    // Create Post records with IDEA status
    const createdIdeas = [];
    for (const idea of ideas) {
      try {
        // Generate AI image if requested
        let imageUrl = null;
        if (validatedData.includeImages) {
          try {
            const imagePrompt = `Professional social media image for: ${
              idea.title
            }. ${idea.description}. Style: modern, clean, ${
              brand.name
            } brand aesthetic. High quality, suitable for ${
              idea.platforms?.join(", ") || "social media"
            }`;

            const imageResponse = await fetch(
              `${
                process.env.NEXTAUTH_URL || "http://localhost:3000"
              }/api/ai/generate-image`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: imagePrompt }),
              },
            );

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              imageUrl = imageData.imageUrl;
            }
          } catch {
            // Continue without image if generation fails
          }
        }

        const post = await prisma.post.create({
          data: {
            organizationId,
            brandId: brand.id,
            platform: idea.platforms?.[0] || "OTHER",
            title: idea.title,
            contentType: "SINGLE_POST",
            status: "IDEA",
            aiPromptUsed: JSON.stringify({
              timeframe: validatedData.timeframe,
              pillar: idea.pillar,
              focusAreas: validatedData.focusAreas,
              includeImages: validatedData.includeImages,
            }),
            createdByUserId: session.user.id,
            updatedByUserId: session.user.id,
          },
        });

        // Create initial version with description and optional image
        await prisma.postVersion.create({
          data: {
            postId: post.id,
            caption: idea.description,
            mediaUrls: imageUrl ? [imageUrl] : [],
            createdByUserId: session.user.id,
            source: "AI_GENERATED",
          },
        });

        createdIdeas.push({
          ...post,
          idea: {
            title: idea.title,
            description: idea.description,
            pillar: idea.pillar,
            platforms: idea.platforms,
            bestTime: idea.bestTime,
          },
        });
      } catch {
        // Skip failed post creation
      }
    }

    return apiSuccess(
      {
        ideas: createdIdeas,
        message: `Generated ${createdIdeas.length} content ideas`,
      },
      { requestId },
    );
  },
  {
    route: "POST /api/ai/generate-ideas",
    rateLimit: RATE_LIMITS.ai,
    bodySchema: generateIdeasSchema,
  },
);
