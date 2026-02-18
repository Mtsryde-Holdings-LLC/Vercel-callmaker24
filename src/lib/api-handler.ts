/**
 * API Route Middleware Wrapper
 * Provides a composable handler that bundles:
 *  - Request ID generation & tracing
 *  - Authentication enforcement
 *  - Organization scoping
 *  - Rate limiting
 *  - Input validation (via Zod)
 *  - Standardized error handling
 *  - Structured logging
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { logger, generateRequestId } from "./logger";
import { applyRateLimit, RateLimitConfig, RATE_LIMITS } from "./rate-limit";
import { apiError, apiUnauthorized, apiForbidden } from "./api-response";
import { ZodSchema, ZodError } from "zod";

/** Extended session type matching our auth setup */
interface AppSession {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    organizationId?: string;
    image?: string;
  };
}

/** Context passed to every handler */
export interface ApiContext {
  /** Unique request ID for tracing */
  requestId: string;
  /** Authenticated user session (present when requireAuth is true) */
  session: AppSession;
  /** Organization ID (present when requireOrg is true) */
  organizationId: string;
  /** Parsed & validated request body (present when bodySchema provided) */
  body: unknown;
  /** Route params (e.g., { id: "..." }) */
  params: Record<string, string>;
}

/** Configuration for the API handler wrapper */
export interface ApiHandlerOptions {
  /** Require authenticated session (default: true) */
  requireAuth?: boolean;
  /** Require organizationId on session (default: true when requireAuth is true) */
  requireOrg?: boolean;
  /** Required role(s) — user must have one of these */
  roles?: string[];
  /** Rate limit config (default: standard 60 req/min) */
  rateLimit?: RateLimitConfig | false;
  /** Rate limit prefix for key namespacing */
  rateLimitPrefix?: string;
  /** Zod schema for request body validation */
  bodySchema?: ZodSchema;
  /** Route name for logging context */
  route?: string;
}

type HandlerFn = (
  request: NextRequest,
  context: ApiContext,
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with enterprise middleware.
 *
 * @example
 * export const POST = withApiHandler(
 *   async (request, { session, organizationId, body, requestId }) => {
 *     const result = await prisma.customer.create({ data: { ...body, organizationId } });
 *     return apiSuccess(result, { requestId });
 *   },
 *   {
 *     route: 'POST /api/customers',
 *     rateLimit: RATE_LIMITS.standard,
 *     bodySchema: createCustomerSchema,
 *   }
 * );
 */
export function withApiHandler(
  handler: HandlerFn,
  options: ApiHandlerOptions = {},
) {
  const {
    requireAuth = true,
    requireOrg = requireAuth,
    roles,
    rateLimit = RATE_LIMITS.standard,
    rateLimitPrefix,
    bodySchema,
    route = "unknown",
  } = options;

  return async (
    request: NextRequest,
    routeContext?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const log = logger.child({ requestId, route });
    const startTime = Date.now();

    try {
      // 1. Rate limiting
      if (rateLimit) {
        const rateLimitResult = await applyRateLimit(
          request,
          rateLimit,
          rateLimitPrefix || route,
        );
        if (rateLimitResult) {
          log.warn("Rate limit exceeded");
          return NextResponse.json(rateLimitResult.body, {
            status: rateLimitResult.status,
            headers: rateLimitResult.headers,
          });
        }
      }

      // 2. Authentication
      let session: AppSession | null = null;
      if (requireAuth) {
        session = (await getServerSession(authOptions)) as AppSession | null;
        if (!session?.user) {
          return apiUnauthorized(requestId);
        }
      }

      // 3. Organization scoping
      let organizationId = "";
      if (requireOrg && session) {
        organizationId = session.user.organizationId || "";
        if (!organizationId) {
          return apiForbidden("Organization membership required", requestId);
        }
      }

      // 4. Role check
      if (roles && roles.length > 0 && session) {
        if (!roles.includes(session.user.role)) {
          log.warn(
            `Role check failed: user role ${session.user.role}, required: ${roles.join(",")}`,
          );
          return apiForbidden("Insufficient permissions", requestId);
        }
      }

      // 5. Body validation
      let parsedBody: unknown = undefined;
      if (bodySchema) {
        try {
          const rawBody = await request.json();
          parsedBody = bodySchema.parse(rawBody);
        } catch (err) {
          if (err instanceof ZodError) {
            const fieldErrors: Record<string, string[]> = {};
            for (const issue of err.issues) {
              const path = issue.path.join(".") || "_root";
              if (!fieldErrors[path]) fieldErrors[path] = [];
              fieldErrors[path].push(issue.message);
            }
            return apiError("Validation failed", {
              status: 422,
              code: "VALIDATION_ERROR",
              meta: { fieldErrors },
              requestId,
            });
          }
          return apiError("Invalid request body", {
            status: 400,
            code: "INVALID_JSON",
            requestId,
          });
        }
      }

      // 6. Resolve params
      let params: Record<string, string> = {};
      if (routeContext?.params) {
        params =
          routeContext.params instanceof Promise
            ? await routeContext.params
            : routeContext.params;
      }

      // 7. Execute handler
      const response = await handler(request, {
        requestId,
        session: session as AppSession,
        organizationId,
        body: parsedBody,
        params,
      });

      // Add request ID to response headers
      response.headers.set("X-Request-Id", requestId);

      const duration = Date.now() - startTime;
      log.info(`${request.method} completed in ${duration}ms`, {
        organizationId: organizationId || undefined,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(`Unhandled error after ${duration}ms`, {}, error);

      return apiError("An internal error occurred", {
        status: 500,
        code: "INTERNAL_ERROR",
        requestId,
        cause: error,
        route,
      });
    }
  };
}

/**
 * Shortcut for public (unauthenticated) routes
 */
export function withPublicApiHandler(
  handler: HandlerFn,
  options: Omit<ApiHandlerOptions, "requireAuth" | "requireOrg"> = {},
) {
  return withApiHandler(handler, {
    ...options,
    requireAuth: false,
    requireOrg: false,
  });
}

/**
 * Shortcut for admin-only routes
 */
export function withAdminHandler(
  handler: HandlerFn,
  options: Omit<ApiHandlerOptions, "roles"> = {},
) {
  return withApiHandler(handler, {
    ...options,
    roles: ["ADMIN", "SUPER_ADMIN", "CORPORATE_ADMIN"],
    rateLimit: options.rateLimit ?? RATE_LIMITS.admin,
  });
}

/**
 * Shortcut for webhook routes (no auth, high rate limit)
 */
export function withWebhookHandler(
  handler: HandlerFn,
  options: Omit<ApiHandlerOptions, "requireAuth" | "requireOrg"> = {},
) {
  return withApiHandler(handler, {
    ...options,
    requireAuth: false,
    requireOrg: false,
    rateLimit: options.rateLimit ?? RATE_LIMITS.webhook,
  });
}
