/**
 * API Handler Middleware Tests
 * Tests the withApiHandler wrapper that provides auth, rate limiting, validation, etc.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { NextRequest } from "next/server";

// Mock next-auth
const mockGetServerSession = jest.fn<(...args: any[]) => any>();
jest.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

// Mock auth options
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// Mock Sentry
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Helper to create mock request
function createRequest(
  url = "http://localhost/api/test",
  options: any = {},
): NextRequest {
  return new NextRequest(new URL(url), {
    ...options,
    headers: {
      "x-forwarded-for": "127.0.0.1",
      ...((options.headers as Record<string, string>) || {}),
    },
  });
}

function mockAuthedSession(overrides = {}) {
  mockGetServerSession.mockResolvedValue({
    user: {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      role: "ADMIN",
      organizationId: "org-1",
      ...overrides,
    },
  });
}

describe("withApiHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when auth required but no session", async () => {
    const { withApiHandler } = await import("@/lib/api-handler");
    const { apiSuccess } = await import("@/lib/api-response");

    mockGetServerSession.mockResolvedValue(null);

    const handler = withApiHandler(
      async (_req, ctx) =>
        apiSuccess({ ok: true }, { requestId: ctx.requestId }),
      { route: "test" },
    );

    const request = createRequest();
    const response = await handler(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 when org required but user has no org", async () => {
    const { withApiHandler } = await import("@/lib/api-handler");
    const { apiSuccess } = await import("@/lib/api-response");

    mockAuthedSession({ organizationId: null });

    const handler = withApiHandler(
      async (_req, ctx) =>
        apiSuccess({ ok: true }, { requestId: ctx.requestId }),
      { route: "test" },
    );

    const request = createRequest();
    const response = await handler(request);

    expect(response.status).toBe(403);
  });

  it("passes organizationId to handler when authenticated", async () => {
    const { withApiHandler } = await import("@/lib/api-handler");
    const { apiSuccess } = await import("@/lib/api-response");

    mockAuthedSession({ organizationId: "org-123" });

    let receivedOrgId = "";
    const handler = withApiHandler(
      async (_req, ctx) => {
        receivedOrgId = ctx.organizationId;
        return apiSuccess({ ok: true }, { requestId: ctx.requestId });
      },
      { route: "test", rateLimit: false },
    );

    const request = createRequest();
    const response = await handler(request);

    expect(response.status).toBe(200);
    expect(receivedOrgId).toBe("org-123");
  });

  it("enforces role restrictions", async () => {
    const { withApiHandler } = await import("@/lib/api-handler");
    const { apiSuccess } = await import("@/lib/api-response");

    mockAuthedSession({ role: "USER" });

    const handler = withApiHandler(
      async (_req, ctx) =>
        apiSuccess({ ok: true }, { requestId: ctx.requestId }),
      { route: "test", roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: false },
    );

    const request = createRequest();
    const response = await handler(request);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("permissions");
  });

  it("allows matching roles", async () => {
    const { withApiHandler } = await import("@/lib/api-handler");
    const { apiSuccess } = await import("@/lib/api-response");

    mockAuthedSession({ role: "SUPER_ADMIN" });

    const handler = withApiHandler(
      async (_req, ctx) =>
        apiSuccess({ ok: true }, { requestId: ctx.requestId }),
      { route: "test", roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: false },
    );

    const request = createRequest();
    const response = await handler(request);

    expect(response.status).toBe(200);
  });

  it("validates body against Zod schema", async () => {
    const { withApiHandler } = await import("@/lib/api-handler");
    const { apiSuccess } = await import("@/lib/api-response");
    const { z } = await import("zod");

    mockAuthedSession();

    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const handler = withApiHandler(
      async (_req, ctx) => apiSuccess(ctx.body, { requestId: ctx.requestId }),
      { route: "test", bodySchema: schema, rateLimit: false },
    );

    // Invalid body
    const badRequest = createRequest("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "", email: "invalid" }),
      headers: { "content-type": "application/json" },
    });

    const badResponse = await handler(badRequest);
    expect(badResponse.status).toBe(422);
    const badBody = await badResponse.json();
    expect(badBody.code).toBe("VALIDATION_ERROR");
  });

  it("passes validated body to handler", async () => {
    const { withApiHandler } = await import("@/lib/api-handler");
    const { apiSuccess } = await import("@/lib/api-response");
    const { z } = await import("zod");

    mockAuthedSession();

    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    let receivedBody: unknown = null;
    const handler = withApiHandler(
      async (_req, ctx) => {
        receivedBody = ctx.body;
        return apiSuccess(ctx.body, { requestId: ctx.requestId });
      },
      { route: "test", bodySchema: schema, rateLimit: false },
    );

    const goodRequest = createRequest("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "John", email: "john@example.com" }),
      headers: { "content-type": "application/json" },
    });

    const goodResponse = await handler(goodRequest);
    expect(goodResponse.status).toBe(200);
    expect(receivedBody).toEqual({ name: "John", email: "john@example.com" });
  });

  it("adds X-Request-Id to all responses", async () => {
    const { withApiHandler } = await import("@/lib/api-handler");
    const { apiSuccess } = await import("@/lib/api-response");

    mockAuthedSession();

    const handler = withApiHandler(
      async (_req, ctx) =>
        apiSuccess({ ok: true }, { requestId: ctx.requestId }),
      { route: "test", rateLimit: false },
    );

    const request = createRequest();
    const response = await handler(request);

    expect(response.headers.get("X-Request-Id")).toBeTruthy();
    expect(response.headers.get("X-Request-Id")).toMatch(/^req_/);
  });

  it("catches unhandled errors and returns 500 with safe message", async () => {
    const { withApiHandler } = await import("@/lib/api-handler");

    mockAuthedSession();

    const handler = withApiHandler(
      async () => {
        throw new Error(
          "Database connection string: postgresql://user:pass@host",
        );
      },
      { route: "test", rateLimit: false },
    );

    const request = createRequest();
    const response = await handler(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("An internal error occurred");
    // Ensure sensitive data is NOT in response
    expect(JSON.stringify(body)).not.toContain("postgresql");
    expect(JSON.stringify(body)).not.toContain("password");
  });

  it("withPublicApiHandler skips auth", async () => {
    const { withPublicApiHandler } = await import("@/lib/api-handler");
    const { apiSuccess } = await import("@/lib/api-response");

    // Don't set any session
    mockGetServerSession.mockResolvedValue(null);

    const handler = withPublicApiHandler(
      async (_req, ctx) =>
        apiSuccess({ public: true }, { requestId: ctx.requestId }),
      { route: "test", rateLimit: false },
    );

    const request = createRequest();
    const response = await handler(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.public).toBe(true);
  });

  it("withAdminHandler requires admin role", async () => {
    const { withAdminHandler } = await import("@/lib/api-handler");
    const { apiSuccess } = await import("@/lib/api-response");

    mockAuthedSession({ role: "USER" });

    const handler = withAdminHandler(
      async (_req, ctx) =>
        apiSuccess({ admin: true }, { requestId: ctx.requestId }),
      { route: "test", rateLimit: false },
    );

    const request = createRequest();
    const response = await handler(request);

    expect(response.status).toBe(403);
  });
});
