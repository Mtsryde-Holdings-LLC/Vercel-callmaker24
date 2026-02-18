import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Shared mock for OpenAI's chat.completions.create — can be overridden per-test
const mockCreate = jest.fn<any>().mockResolvedValue({
  choices: [{ message: { content: "Generated content" } }],
  usage: { total_tokens: 150 },
  model: "gpt-4-turbo-preview",
});

// Mock OpenAI — all instances share the same mockCreate function
jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...args: any[]) => mockCreate(...args),
      },
    },
  })),
}));

// Import after mocking
import { AIService } from "@/services/ai.service";

describe("AIService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default behavior
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Generated content" } }],
      usage: { total_tokens: 150 },
      model: "gpt-4-turbo-preview",
    });
  });

  describe("generateContent", () => {
    it("should generate email content", async () => {
      const result = await AIService.generateContent({
        prompt: "Write a welcome email",
        type: "email",
        tone: "friendly",
        length: "medium",
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe("Generated content");
      expect(result.data?.tokensUsed).toBe(150);
    });

    it("should generate SMS content", async () => {
      const result = await AIService.generateContent({
        prompt: "Write a promotional SMS",
        type: "sms",
        tone: "casual",
        length: "short",
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
    });

    it("should handle generation errors", async () => {
      mockCreate.mockRejectedValueOnce(new Error("API Error"));

      const result = await AIService.generateContent({
        prompt: "Test",
        type: "email",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should respect tone parameter", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "Professional content" } }],
        usage: { total_tokens: 100 },
        model: "gpt-4-turbo-preview",
      });

      await AIService.generateContent({
        prompt: "Write an email",
        type: "email",
        tone: "professional",
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("professional"),
            }),
          ]),
        }),
      );
    });
  });

  describe("generateSubjectLines", () => {
    it("should generate multiple subject lines", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "Subject 1\nSubject 2\nSubject 3",
            },
          },
        ],
        usage: { total_tokens: 80 },
      });

      const result = await AIService.generateSubjectLines("Product launch", 3);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
    });
  });

  describe("generateChatResponse", () => {
    it("should generate chat response", async () => {
      const conversation = [{ role: "user", content: "What are your hours?" }];

      const result = await AIService.generateChatResponse(conversation);

      expect(result.success).toBe(true);
      expect(result.data?.response).toBeDefined();
      expect(result.data?.tokensUsed).toBeDefined();
    });

    it("should use knowledge base if provided", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "Response with KB" } }],
        usage: { total_tokens: 120 },
      });

      const conversation = [{ role: "user", content: "Question" }];
      const knowledgeBase = "We are open 9-5 Monday to Friday";

      await AIService.generateChatResponse(conversation, knowledgeBase);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("knowledge base"),
            }),
          ]),
        }),
      );
    });
  });

  describe("analyzeSentiment", () => {
    it("should analyze positive sentiment", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "positive" } }],
      });

      const result = await AIService.analyzeSentiment("I love this product!");

      expect(result.success).toBe(true);
      expect(result.data).toBe("positive");
    });

    it("should analyze negative sentiment", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "negative" } }],
      });

      const result = await AIService.analyzeSentiment("This is terrible");

      expect(result.success).toBe(true);
      expect(result.data).toBe("negative");
    });
  });

  describe("calculateCost", () => {
    it("should calculate cost for GPT-4", async () => {
      const result = await AIService.generateContent({
        prompt: "Test",
        type: "email",
      });

      expect(result.data?.cost).toBeGreaterThan(0);
    });
  });
});
