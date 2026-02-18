import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { AIService } from "@/services/ai.service";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const generateSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(["email", "sms", "subject", "copy"]),
  context: z.string().optional(),
  tone: z.enum(["professional", "casual", "friendly", "formal"]).optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
});

// POST /api/ai/generate
export const POST = withApiHandler(
  async (request: NextRequest, { session, requestId, body }: ApiContext) => {
    const validatedData = body as z.infer<typeof generateSchema>;

    const result = await AIService.generateContent(validatedData);

    if (!result.success) {
      return apiError(result.error || "Generation failed", {
        status: 500,
        requestId,
      });
    }

    return apiSuccess({ data: result.data }, { requestId });
  },
  {
    route: "POST /api/ai/generate",
    rateLimit: RATE_LIMITS.ai,
    bodySchema: generateSchema,
  },
);
