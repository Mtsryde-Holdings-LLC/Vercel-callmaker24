import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    ])
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = repurposeSchema.parse(body);

    // Get user and verify access
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

    // Get brand voice if brandId provided
    let brandVoice = undefined;
    if (validatedData.brandId) {
      const brand = await prisma.brand.findFirst({
        where: {
          id: validatedData.brandId,
          organizationId: user.organizationId,
        },
        select: { brandVoice: true },
      });
      brandVoice = brand?.brandVoice;
    }

    console.log(
      "[AI Repurpose] Starting repurposing for",
      validatedData.targetPlatforms.length,
      "platforms"
    );

    // Repurpose for each platform
    const repurposedContent = [];

    for (const platform of validatedData.targetPlatforms) {
      try {
        const adaptedText = await aiService.repurposeContent({
          sourceText: validatedData.sourceText,
          targetPlatform: platform,
          targetFormat: validatedData.targetFormat,
          brandVoice,
        });

        // If postId provided, create new versions for existing post
        if (validatedData.postId) {
          const post = await prisma.post.findFirst({
            where: {
              id: validatedData.postId,
              organizationId: user.organizationId,
            },
          });

          if (post) {
            const latestVersion = await prisma.postVersion.findFirst({
              where: { postId: post.id },
              orderBy: { versionNumber: "desc" },
            });

            await prisma.postVersion.create({
              data: {
                postId: post.id,
                versionNumber: (latestVersion?.versionNumber || 0) + 1,
                caption: adaptedText,
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
      } catch (error: any) {
        console.error(`[AI Repurpose] Error for platform ${platform}:`, error);
        repurposedContent.push({
          platform,
          content: null,
          error: error.message,
        });
      }
    }

    console.log(
      "[AI Repurpose] Completed",
      repurposedContent.length,
      "repurposings"
    );

    return NextResponse.json({
      success: true,
      repurposed: repurposedContent,
      message: `Repurposed content for ${validatedData.targetPlatforms.length} platforms`,
    });
  } catch (error: any) {
    console.error("[AI Repurpose] Error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to repurpose content" },
      { status: 500 }
    );
  }
}
