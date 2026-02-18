import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

/** Allowed CORS origin — NEXT_PUBLIC_APP_URL required in production */
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "" : "*");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = generateRequestId();

  // Handle CORS preflight for API routes
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Request-Id",
        "Access-Control-Max-Age": "86400",
        "X-Request-Id": requestId,
      },
    });
  }

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth/signin",
    "/auth/signup",
    "/auth/verify",
    "/auth/error",
    "/demo",
    "/privacy",
    "/terms",
    "/legal",
    "/data-deletion",
    "/policy-acceptance",
    "/loyalty/portal",
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // Helper: create response with request ID header
  function withRequestId(response: NextResponse): NextResponse {
    response.headers.set("X-Request-Id", requestId);
    return response;
  }

  // Allow public routes
  if (isPublicRoute) {
    return withRequestId(NextResponse.next());
  }

  // Protected routes - require authentication
  const protectedRoutes = [
    "/dashboard",
    "/admin",
    "/checkout",
    "/admin-access",
    "/direct-access",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !token) {
    // Redirect to signin if not authenticated
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return withRequestId(NextResponse.redirect(signInUrl));
  }

  // Admin routes - require ADMIN or SUPER_ADMIN role
  if (pathname.startsWith("/admin") && token) {
    const userRole = token.role as string;
    if (
      userRole !== "ADMIN" &&
      userRole !== "SUPER_ADMIN" &&
      userRole !== "CORPORATE_ADMIN"
    ) {
      // Redirect to dashboard if not admin
      return withRequestId(
        NextResponse.redirect(new URL("/dashboard", request.url)),
      );
    }
  }

  return withRequestId(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     * Note: api routes ARE matched for CORS preflight handling
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|widget).*)",
  ],
};
