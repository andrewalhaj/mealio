import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth', '/share', '/_next', '/favicon.ico', '/api/health']
const RESET_ALLOWED = ['/reset-password', '/api/auth/change-password', '/api/auth/logout', '/api/auth/me']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('mealio_session')?.value
  const parts = token?.split('.') ?? []
  if (!token || (parts.length !== 3 && parts.length !== 4)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const mustReset = parts.length === 4 ? parts[2] === '1' : false
  if (mustReset && !RESET_ALLOWED.some(p => pathname.startsWith(p))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Password reset required' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/reset-password', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
