import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerateContentOptions {
  prompt: string;
  type: "email" | "sms" | "subject" | "copy";
  context?: string;
  tone?: "professional" | "casual" | "friendly" | "formal";
  length?: "short" | "medium" | "long";
  maxTokens?: number;
}

export class AIService {
  /**
   * Generate marketing content
   */
  static async generateContent(options: GenerateContentOptions) {
    try {
      const systemPrompt = this.buildSystemPrompt(options.type, options.tone);
      const userPrompt = this.buildUserPrompt(options);

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: options.maxTokens || 2000,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || "";
      const tokensUsed = completion.usage?.total_tokens || 0;

      return {
        success: true,
        data: {
          content,
          tokensUsed,
          model: completion.model,
          cost: this.calculateCost(tokensUsed, completion.model),
        },
      };
    } catch (error: any) {
      console.error("AI generation error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate email subject lines (A/B test variations)
   */
  static async generateSubjectLines(topic: string, count: number = 3) {
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are an expert email marketer. Generate compelling email subject lines that drive opens.",
          },
          {
            role: "user",
            content: `Generate ${count} different email subject lines for: ${topic}. Make them engaging, concise, and action-oriented. Return only the subject lines, one per line.`,
          },
        ],
        max_tokens: 500,
      });

      const content = completion.choices[0].message.content || "";
      const subjects = content.split("\n").filter((line) => line.trim());

      return {
        success: true,
        data: subjects,
        tokensUsed: completion.usage?.total_tokens || 0,
      };
    } catch (error: any) {
      console.error("Subject generation error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate chat response
   */
  static async generateChatResponse(
    conversation: { role: string; content: string }[],
    knowledgeBase?: string,
  ) {
    try {
      const systemPrompt = `You are a helpful customer support assistant. ${
        knowledgeBase
          ? `Use this knowledge base to answer questions:\n\n${knowledgeBase}`
          : ""
      }`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversation.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
        ],
        max_tokens: 1000,
        temperature: 0.5,
      });

      const response = completion.choices[0].message.content || "";
      const tokensUsed = completion.usage?.total_tokens || 0;

      return {
        success: true,
        data: {
          response,
          tokensUsed,
        },
      };
    } catch (error: any) {
      console.error("Chat response error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze customer sentiment
   */
  static async analyzeSentiment(text: string) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Analyze the sentiment of the following text. Respond with only: positive, negative, or neutral.",
          },
          { role: "user", content: text },
        ],
        max_tokens: 10,
      });

      const sentiment =
        completion.choices[0].message.content?.toLowerCase() || "neutral";

      return {
        success: true,
        data: sentiment,
      };
    } catch (error: any) {
      console.error("Sentiment analysis error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build system prompt based on content type
   */
  private static buildSystemPrompt(
    type: string,
    tone: string = "professional",
  ): string {
    const toneMap: Record<string, string> = {
      professional: "professional and business-like",
      casual: "casual and conversational",
      friendly: "warm and friendly",
      formal: "formal and respectful",
    };

    const prompts: Record<string, string> = {
      email: `You are an expert email marketer. Write compelling email content that is ${toneMap[tone]}. Focus on engagement and clear calls-to-action.`,
      sms: `You are an expert SMS marketer. Write concise, impactful SMS messages that are ${toneMap[tone]}. Keep it under 160 characters when possible.`,
      subject: `You are an expert at writing email subject lines. Create compelling subject lines that are ${toneMap[tone]} and drive high open rates.`,
      copy: `You are an expert copywriter. Write persuasive marketing copy that is ${toneMap[tone]} and converts readers into customers.`,
    };

    return prompts[type] || prompts.copy;
  }

  /**
   * Build user prompt
   */
  private static buildUserPrompt(options: GenerateContentOptions): string {
    let prompt = options.prompt;

    if (options.context) {
      prompt += `\n\nContext: ${options.context}`;
    }

    if (options.length) {
      const lengthMap = {
        short: "Keep it brief and concise (1-2 paragraphs).",
        medium: "Make it moderately detailed (3-4 paragraphs).",
        long: "Provide comprehensive detail (5+ paragraphs).",
      };
      prompt += `\n\n${lengthMap[options.length]}`;
    }

    return prompt;
  }

  /**
   * Calculate estimated cost
   */
  private static calculateCost(tokens: number, model: string): number {
    // Rough pricing (update with actual rates)
    const rates: Record<string, number> = {
      "gpt-4-turbo-preview": 0.00003,
      "gpt-4": 0.00006,
      "gpt-3.5-turbo": 0.000002,
    };

    const rate = rates[model] || rates["gpt-3.5-turbo"];
    return tokens * rate;
  }
}
