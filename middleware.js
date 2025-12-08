import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const { nextUrl } = req
  const { pathname } = nextUrl

  // Public Allowed Routes
  const publicRoutes = [
    '/',
    '/login',
    '/auth',
    '/admin/login'
  ]

  // Allow Next.js internal/static/api files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts')
  ) {
    return NextResponse.next()
  }

  // Allow login and public routes
  if (publicRoutes.some(route => pathname.includes(route))) {
    return NextResponse.next()
  }

  // Check NextAuth Token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (token) return NextResponse.next()

  // Find locale
  const localeMatch = pathname.match(/^\/(en|ar|fr)(?:\/|$)/)
  const locale = localeMatch ? localeMatch[1] : 'en'

  return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
}

export const config = {
  matcher: ['/((?!_next|static|api|favicon|fonts|images).*)']
}
