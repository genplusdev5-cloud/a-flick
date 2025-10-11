// Middleware disabled: we've removed global auth enforcement so the app behaves
// like a public site with a simple login page. Keep an empty middleware export
// in case other middlewares rely on its presence.
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Middleware to require authentication across the app.
 * - Allows assets, static files, _next, APIs and the login routes
 * - If no valid NextAuth token is found, redirect to the localized admin login page
 */
export async function middleware(req) {
  const { nextUrl, headers } = req
  const { pathname } = nextUrl

  // Allow next internals, API routes and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/.well-known')
  ) {
    return NextResponse.next()
  }

  // Allow any login or auth pages so users can reach the sign-in flow
  if (pathname.includes('/login') || pathname.includes('/auth')) {
    return NextResponse.next()
  }

  // Get token using next-auth/jwt; requires NEXTAUTH_SECRET set in env
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (token) {
    // User is authenticated
    return NextResponse.next()
  }

  // Not authenticated — redirect to localized admin login
  // Try to detect locale from URL (/en/...)
  const localeMatch = pathname.match(/^\/(en|fr|ar)(?:\/|$)/)
  const locale = localeMatch ? localeMatch[1] : 'en'

  const loginUrl = new URL(`/${locale}/admin/login`, req.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // apply middleware to all routes
  matcher: ['/:path*']
}
