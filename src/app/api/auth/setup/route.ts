import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSessionToken, SESSION_COOKIE, userExists } from '@/lib/auth'

export async function POST(req: NextRequest) {
  if (await userExists()) {
    return NextResponse.json({ error: 'Account already exists' }, { status: 409 })
  }
  const { email, password } = await req.json() as { email: string; password: string }
  if (!email?.includes('@') || !password || password.length < 8) {
    return NextResponse.json({ error: 'Valid email and password (8+ chars) required' }, { status: 400 })
  }
  const user = await db.user.create({ data: { email: email.toLowerCase(), passwordHash: hashPassword(password) } })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/',
  })
  return res
}

export async function GET() {
  return NextResponse.json({ setupNeeded: !(await userExists()) })
}
