import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json() as { token: string; newPassword: string }

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!resetToken) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
  }

  // Check if expired
  if (new Date() > resetToken.expiresAt) {
    return NextResponse.json({ error: 'Reset link has expired' }, { status: 400 })
  }

  // Check if already used
  if (resetToken.usedAt) {
    return NextResponse.json({ error: 'Reset link has already been used' }, { status: 400 })
  }

  // Hash the new password
  const passwordHash = hashPassword(newPassword)

  // Update user password and mark token as used
  await db.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  })

  await db.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() },
  })

  return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 })
}
