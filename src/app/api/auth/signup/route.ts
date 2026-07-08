import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, password, firstName, lastName } = await req.json() as { email: string; password: string; firstName?: string; lastName?: string }
  if (!email?.includes('@') || !password || password.length < 8) {
    return NextResponse.json({ error: 'Valid email and password (8+ chars) required' }, { status: 400 })
  }
  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: 'First and last name required' }, { status: 400 })
  }
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }
  const user = await db.user.create({ data: { email: email.toLowerCase(), passwordHash: hashPassword(password), firstName: firstName.trim(), lastName: lastName.trim() } })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/',
  })
  return res
}
