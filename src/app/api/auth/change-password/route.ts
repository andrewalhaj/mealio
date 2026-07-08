import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId, verifyPassword, hashPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json() as { currentPassword: string; newPassword: string }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!verifyPassword(currentPassword ?? '', user.passwordHash)) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  if (verifyPassword(newPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'New password must differ from current password' }, { status: 400 })
  }

  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashPassword(newPassword),
      mustResetPassword: false,
      sessionsValidFrom: new Date(),
    },
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, createSessionToken(userId, false), {
    httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/',
  })
  return res
}
