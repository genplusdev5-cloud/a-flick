import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const { nextUrl } = req
  const { pathname } = nextUrl

  // Redirect root "/" → default locale "/en/login"
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en/login', req.url))
  }

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

  // Allow login/auth routes to load freely without token
  if (pathname.includes('/login') || pathname.includes('/auth')) {
    return NextResponse.next()
  }

  // Get token using next-auth/jwt
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (token) {
    return NextResponse.next() // User authenticated
  }

  // Detect locale from url (/en/... , /fr/... , etc)
  const localeMatch = pathname.match(/^\/(en|fr|ar)(?:\/|$)/)
  const locale = localeMatch ? localeMatch[1] : 'en'

  // Redirect to correct login page
  return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
}

export const config = {
  matcher: ['/:path*']
}
