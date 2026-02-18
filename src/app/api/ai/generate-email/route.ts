import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const POST = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const body = await request.json();
    const { prompt, subject, campaignName } = body;

    if (!prompt) {
      return apiError("Prompt is required", { status: 400, requestId });
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "placeholder") {
      // Return a template if OpenAI is not configured
      const templateContent = generateTemplateEmail(
        prompt,
        subject,
        campaignName,
      );
      return apiSuccess({ content: templateContent }, { requestId });
    }

    // Call OpenAI API
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
            content:
              "You are an expert email marketing copywriter. Create professional, engaging, and conversion-focused email content. Use HTML formatting for structure. Include a clear call-to-action.",
          },
          {
            role: "user",
            content: `Create an email marketing campaign with the following details:
Campaign: ${campaignName || "Marketing Campaign"}
Subject: ${subject || "N/A"}
Requirements: ${prompt}

Please provide the email body in HTML format with proper structure, compelling copy, and a clear call-to-action button.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      // Fallback to template if AI fails
      const templateContent = generateTemplateEmail(
        prompt,
        subject,
        campaignName,
      );
      return apiSuccess(
        {
          content: templateContent,
          note: "AI service unavailable, using template",
        },
        { requestId },
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    return apiSuccess({ content }, { requestId });
  },
  {
    route: "POST /api/ai/generate-email",
    rateLimit: RATE_LIMITS.ai,
  },
);

// Template generator fallback
function generateTemplateEmail(
  prompt: string,
  subject: string,
  campaignName: string,
): string {
  return `Subject: ${subject || "Special Offer Just for You!"}

Hello valued customer,

${extractKeyMessage(prompt)}

🎯 ${extractHighlight(prompt)}

Don't miss out on this incredible opportunity. Take action today and experience the difference!

[CALL TO ACTION BUTTON]
👉 Get Started Now
[Link: Add your URL here]

---

${extractAdditionalDetails(prompt)}

We're excited to bring you this opportunity and look forward to serving you!

Best regards,
The CallMaker24 Team

---
© ${new Date().getFullYear()} Your Company. All rights reserved.
Unsubscribe | View in browser | Contact Support

P.S. ${extractPSMessage(prompt)}`;
}

function extractKeyMessage(prompt: string): string {
  // Extract the main message from the prompt
  const sentences = prompt.split(".").filter((s) => s.trim().length > 0);
  if (sentences.length > 0) {
    return (
      sentences[0].trim() +
      ". We have something special for you that you won't want to miss."
    );
  }
  return "We have an exciting announcement that we think you'll love!";
}

function extractHighlight(prompt: string): string {
  // Look for numbers or percentages in the prompt
  const percentMatch = prompt.match(/(\d+)%?\s*(off|discount|sale)/i);
  if (percentMatch) {
    return `${percentMatch[1]}% OFF - Limited Time Only!`;
  }

  const dollarMatch = prompt.match(/\$(\d+)/i);
  if (dollarMatch) {
    return `Save $${dollarMatch[1]} Today!`;
  }

  return "Limited Time Special Offer";
}

function extractAdditionalDetails(prompt: string): string {
  // Extract additional context from prompt
  if (prompt.toLowerCase().includes("free shipping")) {
    return "Plus, enjoy FREE SHIPPING on all orders during this promotion!";
  }
  if (
    prompt.toLowerCase().includes("gift") ||
    prompt.toLowerCase().includes("bonus")
  ) {
    return "Order now and receive an exclusive bonus gift with your purchase!";
  }
  if (
    prompt.toLowerCase().includes("member") ||
    prompt.toLowerCase().includes("exclusive")
  ) {
    return "This exclusive offer is available to our valued members only.";
  }
  return "This offer is available for a limited time only. Act fast to secure your spot!";
}

function extractPSMessage(prompt: string): string {
  if (
    prompt.toLowerCase().includes("hurry") ||
    prompt.toLowerCase().includes("limited")
  ) {
    return "Hurry! This offer ends soon. Don't let this opportunity pass you by.";
  }
  if (
    prompt.toLowerCase().includes("sale") ||
    prompt.toLowerCase().includes("discount")
  ) {
    return "Remember, these incredible savings won't last forever!";
  }
  return "Questions? Our team is here to help. Reply to this email anytime!";
}
