import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/signout',
    '/auth/error',
    '/auth/verify-request',
    '/admin-access',
    '/api/auth',
    '/terms',
    '/privacy',
    '/_next',
    '/favicon.ico',
  ]

  // Check if path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicPath) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If user is authenticated
  if (token) {
    // Super admins bypass policy check
    if (token.role === 'SUPER_ADMIN') {
      return NextResponse.next()
    }

    // Check if user has accepted policy
    const policyAccepted = token.policyAccepted as boolean

    // If accessing policy acceptance page, allow it
    if (pathname === '/policy-acceptance' || pathname.startsWith('/api/user/accept-policy')) {
      return NextResponse.next()
    }

    // If user hasn't accepted policy and trying to access protected routes
    if (!policyAccepted && !isPublicPath && pathname !== '/policy-acceptance') {
      return NextResponse.redirect(new URL('/policy-acceptance', request.url))
    }

    // If user has accepted policy but trying to access policy page, redirect to dashboard
    if (policyAccepted && pathname === '/policy-acceptance') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
