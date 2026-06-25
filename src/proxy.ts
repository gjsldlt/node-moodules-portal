import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}

/**
 * Edge-compatible middleware — simple string comparison only.
 * Does NOT import server.ts or any Node-only module (server-only guard
 * would throw at Edge runtime).
 *
 * Belt-and-suspenders: AdminLayout also verifies the cookie server-side.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // Login page is always accessible
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const token = request.cookies.get('tp_admin_token')?.value
  const expectedToken = process.env.ADMIN_SESSION_TOKEN

  if (!token || !expectedToken || token !== expectedToken) {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}
