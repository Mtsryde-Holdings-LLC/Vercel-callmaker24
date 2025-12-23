import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
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
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    // Redirect to signin if not authenticated
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
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
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (have their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|widget).*)",
  ],
};
