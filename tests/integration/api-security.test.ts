/**
 * API Security Tests for Multi-Tenant Routes
 *
 * Tests authentication and authorization for protected API routes.
 * Uses mocked getServerSession and prisma to validate auth/org checks.
 */

import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

// Mock @sentry/nextjs so require('next.config.js') doesn't fail
jest.mock("@sentry/nextjs", () => ({
  withSentryConfig: (config: any) => config,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

const mockPrisma = {
  user: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  customer: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  emailCampaign: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  smsCampaign: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
  $disconnect: jest.fn(),
};
jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

// Silence console in tests
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.clearAllMocks());

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(url: string, method = "GET", body?: unknown): NextRequest {
  const init: any = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

const MOCK_ORG_ID = "org-test-123";
const MOCK_USER = {
  id: "user-test-1",
  email: "admin@test.com",
  organizationId: MOCK_ORG_ID,
  role: "CORPORATE_ADMIN",
};

function mockAuthed(orgId: string | null = MOCK_ORG_ID) {
  mockGetServerSession.mockResolvedValue({
    user: { ...MOCK_USER, organizationId: orgId },
  });
  mockPrisma.user.findUnique.mockResolvedValue({
    ...MOCK_USER,
    organizationId: orgId,
  });
}

function mockUnauthed() {
  mockGetServerSession.mockResolvedValue(null);
}

// ── Customer API ─────────────────────────────────────────────────────────────

describe("Customer API Security", () => {
  let handler: { GET: (req: NextRequest) => Promise<Response> };

  beforeAll(async () => {
    handler = await import("@/app/api/customers/route");
  });

  describe("GET /api/customers", () => {
    test("Returns 401 without authentication", async () => {
      mockUnauthed();
      const res = await handler.GET(makeRequest("/api/customers"));
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    test("Returns 403 without organizationId", async () => {
      mockAuthed(null);
      const res = await handler.GET(makeRequest("/api/customers"));
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.toLowerCase()).toContain("organization");
    });

    test("Scopes query to user organizationId", async () => {
      mockAuthed(MOCK_ORG_ID);
      mockPrisma.customer.findMany.mockResolvedValue([]);
      mockPrisma.customer.count.mockResolvedValue(0);

      const res = await handler.GET(makeRequest("/api/customers"));
      expect(res.status).toBe(200);

      // Verify Prisma was called with the correct organizationId filter
      const call = mockPrisma.customer.findMany.mock.calls[0]?.[0];
      expect(call?.where?.organizationId).toBe(MOCK_ORG_ID);
    });
  });
});

// ── Error Response Sanitization ──────────────────────────────────────────────

describe("Error Response Sanitization", () => {
  test("500 responses do not leak error.message or error.stack", async () => {
    // Import a route and force an error
    mockAuthed(MOCK_ORG_ID);
    // Make prisma throw to trigger catch block
    mockPrisma.customer.findMany.mockRejectedValue(
      new Error("SENSITIVE: connection string postgresql://user:pass@host/db"),
    );
    mockPrisma.customer.count.mockRejectedValue(new Error("DB down"));

    const handler = await import("@/app/api/customers/route");
    const res = await handler.GET(makeRequest("/api/customers"));

    expect(res.status).toBe(500);
    const json = await res.json();

    // Must NOT contain the sensitive error message
    const body = JSON.stringify(json);
    expect(body).not.toContain("SENSITIVE");
    expect(body).not.toContain("postgresql://");
    expect(body).not.toContain("connection string");
    // Should have a generic error
    expect(json.error).toBeDefined();
  });
});

// ── Rate Limiter Unit Tests ──────────────────────────────────────────────────

describe("Rate Limiter", () => {
  let checkRateLimit: (
    key: string,
    config: { maxRequests: number; windowSeconds: number },
  ) => Promise<{
    allowed: boolean;
    remaining: number;
    retryAfterSeconds?: number;
  }>;
  let RATE_LIMITS: Record<
    string,
    { maxRequests: number; windowSeconds: number }
  >;

  beforeAll(async () => {
    const mod = await import("@/lib/rate-limit");
    checkRateLimit = mod.checkRateLimit;
    RATE_LIMITS = mod.RATE_LIMITS;
  });

  test("Allows requests within limit", async () => {
    const config = { maxRequests: 3, windowSeconds: 60 };
    const result1 = await checkRateLimit("test-allow-1", config);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);
  });

  test("Blocks requests exceeding limit", async () => {
    const config = { maxRequests: 2, windowSeconds: 60 };
    const key = "test-block-1";
    await checkRateLimit(key, config); // 1st
    await checkRateLimit(key, config); // 2nd (maxed)
    const result = await checkRateLimit(key, config); // 3rd — blocked
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test("Tracks remaining count correctly", async () => {
    const config = { maxRequests: 5, windowSeconds: 60 };
    const key = "test-remaining-1";
    expect((await checkRateLimit(key, config)).remaining).toBe(4);
    expect((await checkRateLimit(key, config)).remaining).toBe(3);
    expect((await checkRateLimit(key, config)).remaining).toBe(2);
  });

  test("Default rate limits are defined for all categories", () => {
    expect(RATE_LIMITS.standard).toBeDefined();
    expect(RATE_LIMITS.auth).toBeDefined();
    expect(RATE_LIMITS.ai).toBeDefined();
    expect(RATE_LIMITS.webhook).toBeDefined();
    expect(RATE_LIMITS.admin).toBeDefined();
    expect(RATE_LIMITS.chatbot).toBeDefined();

    // Auth should be more restrictive than standard
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThan(
      RATE_LIMITS.standard.maxRequests,
    );
  });
});

// ── Logger Unit Tests ────────────────────────────────────────────────────────

describe("Structured Logger", () => {
  let logger: {
    info: (msg: string, ctx?: Record<string, unknown>) => void;
    warn: (msg: string, ctx?: Record<string, unknown>) => void;
    error: (msg: string, ctx?: Record<string, unknown>, err?: unknown) => void;
  };

  beforeAll(async () => {
    const mod = await import("@/lib/logger");
    logger = mod.logger;
  });

  test("Logger has all required methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  test("Logger does not throw on invocation", () => {
    expect(() => logger.info("test message")).not.toThrow();
    expect(() => logger.warn("test warning")).not.toThrow();
    expect(() =>
      logger.error("test error", {}, new Error("test")),
    ).not.toThrow();
  });

  test("Error logger handles non-Error objects", () => {
    expect(() => logger.error("test", {}, "string error")).not.toThrow();
    expect(() => logger.error("test", {}, 42)).not.toThrow();
    expect(() => logger.error("test", {}, null)).not.toThrow();
  });
});

// ── Constants Centralization ─────────────────────────────────────────────────

describe("Constants Centralization", () => {
  test("All required constants are exported", async () => {
    const constants = await import("@/lib/constants");

    expect(constants.APP_NAME).toBeDefined();
    expect(typeof constants.APP_NAME).toBe("string");
    expect(constants.APP_NAME.length).toBeGreaterThan(0);

    expect(constants.SUPPORT_EMAIL).toBeDefined();
    expect(constants.SUPPORT_EMAIL).toContain("@");

    expect(constants.PRICING).toBeDefined();
    expect(constants.PRICING.STARTER).toBeDefined();
    expect(constants.PRICING.STARTER.monthly).toBeGreaterThan(0);
  });
});

// ── Security Configuration ───────────────────────────────────────────────────

describe("Security Configuration", () => {
  test("next.config.js does not ignore build errors", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nextConfig = require("../../next.config.js");

    // These must be false for production safety
    expect(nextConfig.typescript?.ignoreBuildErrors).not.toBe(true);
    expect(nextConfig.eslint?.ignoreDuringBuilds).not.toBe(true);
  });

  test("Security headers are configured", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nextConfig = require("../../next.config.js");

    // headers should be a function
    expect(typeof nextConfig.headers).toBe("function");
  });
});
