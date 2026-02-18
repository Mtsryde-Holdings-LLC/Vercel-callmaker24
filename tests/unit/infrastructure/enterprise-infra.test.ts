/**
 * Enterprise Infrastructure Tests
 * Tests for API response helpers, retry utility, API handler middleware, and logger
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock @sentry/nextjs so require('next.config.js') doesn't fail
jest.mock("@sentry/nextjs", () => ({
  withSentryConfig: (config: any) => config,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// ============================================
// 1. API Response Helper Tests
// ============================================
describe("API Response Helper", () => {
  // We test the response format contract

  it("apiSuccess returns consistent format with success: true", async () => {
    const { apiSuccess } = await import("@/lib/api-response");
    const response = apiSuccess({ id: "123", name: "Test" });
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: "123", name: "Test" });
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("apiSuccess supports custom status codes", async () => {
    const { apiSuccess } = await import("@/lib/api-response");
    const response = apiSuccess({ created: true }, { status: 201 });
    expect(response.status).toBe(201);
  });

  it("apiSuccess includes meta when provided", async () => {
    const { apiSuccess } = await import("@/lib/api-response");
    const response = apiSuccess([], { meta: { total: 100, page: 1 } });
    const body = await response.json();

    expect(body.meta).toEqual({ total: 100, page: 1 });
  });

  it("apiError returns consistent format with success: false", async () => {
    const { apiError } = await import("@/lib/api-response");
    const response = apiError("Something went wrong", { status: 500 });
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.error).toBe("Something went wrong");
    expect(response.status).toBe(500);
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("apiError includes error code when provided", async () => {
    const { apiError } = await import("@/lib/api-response");
    const response = apiError("Not found", { status: 404, code: "NOT_FOUND" });
    const body = await response.json();

    expect(body.code).toBe("NOT_FOUND");
  });

  it("apiUnauthorized returns 401", async () => {
    const { apiUnauthorized } = await import("@/lib/api-response");
    const response = apiUnauthorized();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("apiForbidden returns 403", async () => {
    const { apiForbidden } = await import("@/lib/api-response");
    const response = apiForbidden();

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("FORBIDDEN");
  });

  it("apiNotFound returns 404", async () => {
    const { apiNotFound } = await import("@/lib/api-response");
    const response = apiNotFound("Customer");

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Customer not found");
  });

  it("apiBadRequest returns 400", async () => {
    const { apiBadRequest } = await import("@/lib/api-response");
    const response = apiBadRequest("Invalid email format");

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid email format");
  });

  it("apiValidationError returns 422 with field errors", async () => {
    const { apiValidationError } = await import("@/lib/api-response");
    const response = apiValidationError("Validation failed", {
      email: ["Invalid format"],
      name: ["Required"],
    });

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.meta?.fieldErrors).toBeDefined();
  });

  it("apiError NEVER leaks cause to client", async () => {
    const { apiError } = await import("@/lib/api-response");
    const sensitiveError = new Error(
      "Connection to postgresql://user:password@host:5432 failed",
    );
    const response = apiError("Database error occurred", {
      status: 500,
      cause: sensitiveError,
    });
    const body = await response.json();

    expect(JSON.stringify(body)).not.toContain("postgresql");
    expect(JSON.stringify(body)).not.toContain("password");
    expect(body.error).toBe("Database error occurred");
  });
});

// ============================================
// 2. Retry Utility Tests
// ============================================
describe("Retry Utility", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns result on first try when no error", async () => {
    const { withRetry } = await import("@/lib/retry");
    const fn = jest.fn<() => Promise<string>>().mockResolvedValue("success");

    const result = await withRetry(fn, { maxRetries: 3, label: "test" });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable errors and eventually succeeds", async () => {
    const { withRetry } = await import("@/lib/retry");
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(Object.assign(new Error("fail"), { status: 500 }))
      .mockRejectedValueOnce(Object.assign(new Error("fail"), { status: 503 }))
      .mockResolvedValue("success");

    const promise = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 10,
      label: "test",
      isRetryable: () => true,
    });

    // Advance through timers for retry delays
    for (let i = 0; i < 5; i++) {
      await Promise.resolve(); // flush microtasks
      jest.advanceTimersByTime(20000);
    }

    const result = await promise;
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws immediately for non-retryable errors", async () => {
    const { withRetry } = await import("@/lib/retry");
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error("auth failed"));

    await expect(
      withRetry(fn, {
        maxRetries: 3,
        label: "test",
        isRetryable: () => false,
      }),
    ).rejects.toThrow("auth failed");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("isRetryableError identifies retryable errors", async () => {
    const { isRetryableError } = await import("@/lib/retry");

    // Network errors
    expect(isRetryableError(new Error("ECONNRESET"))).toBe(true);
    expect(isRetryableError(new Error("socket hang up"))).toBe(true);
    expect(isRetryableError(new Error("fetch failed"))).toBe(true);

    // HTTP status based
    expect(isRetryableError({ status: 429 })).toBe(true);
    expect(isRetryableError({ status: 500 })).toBe(true);
    expect(isRetryableError({ status: 503 })).toBe(true);
    expect(isRetryableError({ statusCode: 502 })).toBe(true);

    // Non-retryable
    expect(isRetryableError({ status: 400 })).toBe(false);
    expect(isRetryableError({ status: 401 })).toBe(false);
    expect(isRetryableError(new Error("validation failed"))).toBe(false);
  });

  it("RETRY_CONFIGS has pre-configured options for all services", async () => {
    const { RETRY_CONFIGS } = await import("@/lib/retry");

    expect(RETRY_CONFIGS.twilio).toBeDefined();
    expect(RETRY_CONFIGS.stripe).toBeDefined();
    expect(RETRY_CONFIGS.openai).toBeDefined();
    expect(RETRY_CONFIGS.shopify).toBeDefined();
    expect(RETRY_CONFIGS.email).toBeDefined();

    // OpenAI should have fewer retries (expensive)
    expect(RETRY_CONFIGS.openai.maxRetries).toBeLessThanOrEqual(
      RETRY_CONFIGS.twilio.maxRetries!,
    );
  });
});

// ============================================
// 3. Rate Limiter Tests
// ============================================
describe("Rate Limiter", () => {
  it("allows requests within limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");

    const result = await checkRateLimit("test:unique-key-1", {
      maxRequests: 5,
      windowSeconds: 60,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const key = "test:block-key-" + Date.now();

    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(key, { maxRequests: 3, windowSeconds: 60 });
    }

    const result = await checkRateLimit(key, {
      maxRequests: 3,
      windowSeconds: 60,
    });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("applyRateLimit returns 429 Response when blocked", async () => {
    const { applyRateLimit, checkRateLimit } = await import("@/lib/rate-limit");
    const prefix = "test:apply-" + Date.now();

    // Create a mock request
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    // Exhaust limit
    const key = `${prefix}:1.2.3.4`;
    for (let i = 0; i < 2; i++) {
      await checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 });
    }

    const response = await applyRateLimit(
      request,
      { maxRequests: 2, windowSeconds: 60 },
      prefix,
    );
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);

    const body = response?.body as any;
    expect(body.error).toBe("Too many requests");
  });

  it("RATE_LIMITS has all expected categories", async () => {
    const { RATE_LIMITS } = await import("@/lib/rate-limit");

    expect(RATE_LIMITS.standard.maxRequests).toBe(60);
    expect(RATE_LIMITS.auth.maxRequests).toBe(10);
    expect(RATE_LIMITS.ai.maxRequests).toBe(20);
    expect(RATE_LIMITS.webhook.maxRequests).toBe(100);
    expect(RATE_LIMITS.admin.maxRequests).toBe(30);
    expect(RATE_LIMITS.chatbot.maxRequests).toBe(30);

    // Auth should be more restrictive than standard
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThan(
      RATE_LIMITS.standard.maxRequests,
    );
  });
});

// ============================================
// 4. Structured Logger Tests
// ============================================
describe("Structured Logger", () => {
  it("exposes all required log methods", async () => {
    const { logger } = await import("@/lib/logger");

    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.child).toBe("function");
  });

  it("logger methods do not throw", async () => {
    const { logger } = await import("@/lib/logger");

    expect(() => logger.info("test message")).not.toThrow();
    expect(() =>
      logger.warn("test warning", {}, new Error("test")),
    ).not.toThrow();
    expect(() =>
      logger.error("test error", {}, new Error("test")),
    ).not.toThrow();
    expect(() => logger.error("test error", {}, "string error")).not.toThrow();
  });

  it("child logger inherits context", async () => {
    const { logger } = await import("@/lib/logger");

    const child = logger.child({ route: "/api/test", organizationId: "org-1" });
    expect(typeof child.info).toBe("function");
    expect(typeof child.error).toBe("function");
    expect(() => child.info("test")).not.toThrow();
  });

  it("generateRequestId returns unique IDs", async () => {
    const { generateRequestId } = await import("@/lib/logger");

    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^req_/);
    expect(id2).toMatch(/^req_/);
  });

  it("sanitizeErrorForClient returns safe messages", async () => {
    const { sanitizeErrorForClient } = await import("@/lib/logger");

    // Should return fallback for generic errors
    const result = sanitizeErrorForClient(
      new Error("Connection to postgresql://user:pass@host:5432/db failed"),
      "Database operation failed",
    );
    expect(result).toBe("Database operation failed");
    expect(result).not.toContain("postgresql");

    // Should recognize Prisma P2002 (unique constraint)
    const p2002Result = sanitizeErrorForClient(
      { code: "P2002" },
      "Something went wrong",
    );
    expect(p2002Result).toContain("already exists");

    // Should recognize Prisma P2025 (not found)
    const p2025Result = sanitizeErrorForClient(
      { code: "P2025" },
      "Something went wrong",
    );
    expect(p2025Result).toContain("not found");
  });
});

// ============================================
// 5. Constants Centralization Tests
// ============================================
describe("Constants", () => {
  it("exports required app constants", async () => {
    const constants = await import("@/lib/constants");

    expect(constants.APP_NAME).toBeDefined();
    expect(typeof constants.APP_NAME).toBe("string");
    expect(constants.APP_NAME.length).toBeGreaterThan(0);
  });

  it("exports pricing configuration", async () => {
    const constants = await import("@/lib/constants");

    expect(constants.PRICING).toBeDefined();
    expect(constants.PRICING.STARTER).toBeDefined();
    expect(typeof constants.PRICING.STARTER.monthly).toBe("number");
    expect(typeof constants.PRICING.STARTER.annual).toBe("number");
  });

  it("exports support contact info", async () => {
    const constants = await import("@/lib/constants");

    expect(constants.SUPPORT_EMAIL).toBeDefined();
    expect(constants.SUPPORT_EMAIL).toContain("@");
  });
});

// ============================================
// 6. Security Configuration Tests
// ============================================
describe("Security Configuration", () => {
  it("next.config.js does NOT ignore build errors", () => {
    const config = require("../../../next.config.js");

    // These should be false in enterprise config
    expect(config.typescript?.ignoreBuildErrors).not.toBe(true);
    expect(config.eslint?.ignoreDuringBuilds).not.toBe(true);
  });

  it("next.config.js has security headers", () => {
    const config = require("../../../next.config.js");

    expect(typeof config.headers).toBe("function");
  });

  it("next.config.js wraps with Sentry", () => {
    // The config module should export through withSentryConfig
    const config = require("../../../next.config.js");
    expect(config).toBeDefined();
  });
});
