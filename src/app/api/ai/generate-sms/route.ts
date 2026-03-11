import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const POST = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await request.json();
    const { prompt, campaignName, tone } = body;

    if (!prompt) {
      return apiError("Prompt is required", { status: 400, requestId });
    }

    // Fetch org info for business voice context
    let businessContext = "";
    try {
      if (organizationId) {
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true, domain: true, settings: true },
        });
        if (org) {
          businessContext = `Business name: ${org.name}.`;
          if (org.domain) businessContext += ` Website: ${org.domain}.`;
          const settings = org.settings as Record<string, string> | null;
          if (settings?.industry) businessContext += ` Industry: ${settings.industry}.`;
          if (settings?.description) businessContext += ` About: ${settings.description}.`;
        }
      }
    } catch {
      // Continue without business context
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "placeholder") {
      const content = generateTemplateSms(prompt, campaignName);
      return apiSuccess({ content }, { requestId });
    }

    const toneInstruction = tone
      ? `Use a ${tone} tone.`
      : "Use a friendly, conversational tone.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert SMS marketing copywriter. Create concise, high-converting text messages.
Rules:
- Keep messages under 160 characters when possible
- Include a clear call-to-action
- No hashtags, no emojis overload (1-2 max)
- Sound human and conversational, not robotic
- Include opt-out hint only if requested
- Match the business voice and brand personality
${businessContext ? `\nBusiness context: ${businessContext}` : ""}
${toneInstruction}`,
          },
          {
            role: "user",
            content: `Write an SMS marketing message with these details:
Campaign: ${campaignName || "Marketing Campaign"}
Requirements: ${prompt}

Provide ONLY the SMS text, nothing else. No quotes, no labels, just the message.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const content = generateTemplateSms(prompt, campaignName);
      return apiSuccess(
        { content, note: "AI service unavailable, using template" },
        { requestId },
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || "";

    return apiSuccess({ content }, { requestId });
  },
  {
    route: "POST /api/ai/generate-sms",
    rateLimit: RATE_LIMITS.ai,
  },
);

function generateTemplateSms(prompt: string, _campaignName?: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes("sale") || lowerPrompt.includes("discount")) {
    const percentMatch = prompt.match(/(\d+)%/);
    const pct = percentMatch ? percentMatch[1] : "20";
    return `🎉 ${pct}% OFF everything! Shop now before it's gone. Limited time only. Reply STOP to opt out.`;
  }

  if (lowerPrompt.includes("loyalty") || lowerPrompt.includes("reward")) {
    return `You've earned rewards! Check your loyalty balance and redeem your points today. Reply STOP to opt out.`;
  }

  if (lowerPrompt.includes("new") && (lowerPrompt.includes("product") || lowerPrompt.includes("arrival"))) {
    return `Just dropped! Check out our newest arrivals. Be the first to shop. Reply STOP to opt out.`;
  }

  if (lowerPrompt.includes("reminder") || lowerPrompt.includes("appointment")) {
    return `Friendly reminder: Don't forget about us! Visit us today for something special. Reply STOP to opt out.`;
  }

  return `Hey! We have something special for you. Check it out today! Reply STOP to opt out.`;
}
