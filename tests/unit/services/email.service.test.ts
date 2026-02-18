import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Set env vars needed by the email service before any imports
process.env.RESEND_API_KEY = "re_test_mock_key";

// Shared mock for Resend emails.send — can be overridden per-test
const mockSend = jest.fn<any>().mockResolvedValue({
  data: { id: "test-email-id" },
  error: null,
});

// Mock Resend
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: (...args: any[]) => mockSend(...args),
    },
  })),
}));

// Mock retry to pass through without delay
jest.mock("@/lib/retry", () => ({
  withRetry: async (fn: () => any) => fn(),
  RETRY_CONFIGS: {
    email: { maxRetries: 0, initialDelayMs: 0, label: "email" },
    twilio: { maxRetries: 0, initialDelayMs: 0, label: "twilio" },
    stripe: { maxRetries: 0, initialDelayMs: 0, label: "stripe" },
    openai: { maxRetries: 0, initialDelayMs: 0, label: "openai" },
    shopify: { maxRetries: 0, initialDelayMs: 0, label: "shopify" },
  },
  isRetryableError: () => false,
}));

// Mock Prisma with all models used by EmailService
jest.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findFirst: jest.fn<any>().mockResolvedValue(null),
      create: jest.fn<any>().mockResolvedValue({
        id: "cust-1",
        email: "test@example.com",
        organizationId: "org-1",
      }),
    },
    emailMessage: {
      update: jest.fn<any>().mockResolvedValue({}),
      create: jest.fn<any>().mockResolvedValue({ id: "msg-1" }),
    },
    customerActivity: {
      create: jest.fn<any>().mockResolvedValue({}),
    },
  },
}));

// Import after mocking
import { EmailService } from "@/services/email.service";

describe("EmailService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default successful behavior
    mockSend.mockResolvedValue({
      data: { id: "test-email-id" },
      error: null,
    });
  });

  describe("send", () => {
    it("should send email successfully", async () => {
      const result = await EmailService.send({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      expect(result.success).toBe(true);
      expect((result as any).data).toBeDefined();
    });

    it("should handle send errors", async () => {
      // Make the send function throw to trigger error handling
      mockSend.mockRejectedValueOnce(new Error("Send failed"));

      const result = await EmailService.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should include all email fields", async () => {
      mockSend.mockResolvedValueOnce({ data: { id: "test" }, error: null });

      await EmailService.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
        from: "sender@example.com",
        replyTo: "reply@example.com",
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>",
          text: "Test",
          reply_to: "reply@example.com",
        }),
      );
    });
  });

  describe("sendBatch", () => {
    it("should send multiple emails", async () => {
      const emails = [
        { to: "test1@example.com", subject: "Test 1", html: "<p>Test 1</p>" },
        { to: "test2@example.com", subject: "Test 2", html: "<p>Test 2</p>" },
      ];

      const result = await EmailService.sendBatch(emails);

      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });
  });

  describe("trackOpen", () => {
    it("should update email message status on open", async () => {
      const { prisma } = require("@/lib/prisma");

      await EmailService.trackOpen("message-id-123");

      expect(prisma.emailMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "message-id-123" },
          data: expect.objectContaining({
            status: "OPENED",
            openCount: { increment: 1 },
          }),
        }),
      );
    });
  });

  describe("trackClick", () => {
    it("should update email message status on click", async () => {
      const { prisma } = require("@/lib/prisma");

      await EmailService.trackClick("message-id-123");

      expect(prisma.emailMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "message-id-123" },
          data: expect.objectContaining({
            status: "CLICKED",
            clickCount: { increment: 1 },
          }),
        }),
      );
    });
  });
});
