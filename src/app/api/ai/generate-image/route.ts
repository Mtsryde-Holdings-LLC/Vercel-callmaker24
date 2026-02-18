import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const generateImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
  quality: z.enum(["standard", "hd"]).default("standard"),
});

export const POST = withApiHandler(
  async (request: NextRequest, { session, requestId, body }: ApiContext) => {
    const validatedData = body as z.infer<typeof generateImageSchema>;

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Return a placeholder image URL
      const placeholderUrl = `https://placehold.co/1024x1024/6366f1/ffffff?text=${encodeURIComponent(
        "AI+Generated+Image",
      )}`;

      return apiSuccess(
        {
          imageUrl: placeholderUrl,
          message:
            "Placeholder image (configure OPENAI_API_KEY for real generation)",
        },
        { requestId },
      );
    }

    // Call OpenAI DALL-E API
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
      },
    );

    if (!response.ok) {
      // Return placeholder on API error
      const placeholderUrl = `https://placehold.co/1024x1024/6366f1/ffffff?text=${encodeURIComponent(
        "AI+Generated+Image",
      )}`;
      return apiSuccess(
        {
          imageUrl: placeholderUrl,
          message: "Placeholder image (OpenAI API error)",
        },
        { requestId },
      );
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      const placeholderUrl = `https://placehold.co/1024x1024/6366f1/ffffff?text=${encodeURIComponent(
        "AI+Generated+Image",
      )}`;
      return apiSuccess(
        {
          imageUrl: placeholderUrl,
          message: "Placeholder image (generation failed)",
        },
        { requestId },
      );
    }

    return apiSuccess(
      {
        imageUrl,
        revisedPrompt: data.data?.[0]?.revised_prompt,
      },
      { requestId },
    );
  },
  {
    route: "POST /api/ai/generate-image",
    rateLimit: RATE_LIMITS.ai,
    bodySchema: generateImageSchema,
  },
);
