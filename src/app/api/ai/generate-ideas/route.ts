import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = generateIdeasSchema.parse(body);

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

    // Get brand and verify ownership
    const brand = await prisma.brand.findFirst({
      where: {
        id: validatedData.brandId,
        organizationId: user.organizationId,
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    console.log(
      "[AI Ideas] Generating",
      validatedData.numberOfIdeas,
      "ideas for brand:",
      brand.name
    );

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
            // Create a detailed image prompt based on the idea
            const imagePrompt = `Professional social media image for: ${idea.title}. ${idea.description}. Style: modern, clean, ${brand.name} brand aesthetic. High quality, suitable for ${idea.platforms?.join(', ') || 'social media'}`;
            
            const imageResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/generate-image`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: imagePrompt }),
            });
            
            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              imageUrl = imageData.imageUrl;
            }
          } catch (imgError) {
            console.error('[AI Ideas] Image generation failed:', imgError);
            // Continue without image if generation fails
          }
        }

        const post = await prisma.post.create({
          data: {
            organizationId: user.organizationId,
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
      } catch (error: any) {
        console.error("[AI Ideas] Error creating post:", error);
      }
    }

    console.log("[AI Ideas] Created", createdIdeas.length, "idea posts");

    return NextResponse.json({
      success: true,
      ideas: createdIdeas,
      message: `Generated ${createdIdeas.length} content ideas`,
    });
  } catch (error: any) {
    console.error("[AI Ideas] Error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
