import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const generateImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
  quality: z.enum(["standard", "hd"]).default("standard"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = generateImageSchema.parse(body);

    console.log(
      "[AI Image] Generating image with prompt:",
      validatedData.prompt
    );

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        "[AI Image] OpenAI API key not configured, returning placeholder"
      );

      // Return a placeholder image URL (you can use a service like Unsplash or generate a colored placeholder)
      const placeholderUrl = `https://placehold.co/1024x1024/6366f1/ffffff?text=${encodeURIComponent(
        "AI+Generated+Image"
      )}`;

      return NextResponse.json({
        success: true,
        imageUrl: placeholderUrl,
        message:
          "Placeholder image (configure OPENAI_API_KEY for real generation)",
      });
    }

    // Call OpenAI DALL-E API
    try {
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: validatedData.prompt,
            n: 1,
            size: validatedData.size,
            quality: validatedData.quality,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("[AI Image] OpenAI API error:", error);

        // Return placeholder on API error
        const placeholderUrl = `https://placehold.co/1024x1024/6366f1/ffffff?text=${encodeURIComponent(
          "AI+Generated+Image"
        )}`;
        return NextResponse.json({
          success: true,
          imageUrl: placeholderUrl,
          message: "Placeholder image (OpenAI API error)",
        });
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error("No image URL in response");
      }

      console.log("[AI Image] Successfully generated image");

      return NextResponse.json({
        success: true,
        imageUrl,
        revisedPrompt: data.data?.[0]?.revised_prompt,
      });
    } catch (apiError: any) {
      console.error("[AI Image] API call failed:", apiError);

      // Return placeholder on error
      const placeholderUrl = `https://placehold.co/1024x1024/6366f1/ffffff?text=${encodeURIComponent(
        "AI+Generated+Image"
      )}`;
      return NextResponse.json({
        success: true,
        imageUrl: placeholderUrl,
        message: "Placeholder image (generation failed)",
      });
    }
  } catch (error: any) {
    console.error("[AI Image] Error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
