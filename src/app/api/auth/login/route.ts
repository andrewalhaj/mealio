import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email: string; password: string }
  const user = await db.user.findUnique({ where: { email: email?.toLowerCase() ?? '' } })
  if (!user || !verifyPassword(password ?? '', user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/',
  })
  return res
}
