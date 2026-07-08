import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email: string }

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) {
    // Don't leak whether email exists; return success anyway
    return NextResponse.json(
      { message: 'If that email exists, a reset link has been sent', resetUrl: null },
      { status: 200 }
    )
  }

  // Generate a 32-byte random token
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Upsert: clear old tokens and create new one
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } })
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })

  const resetUrl = `/reset?token=${token}`

  return NextResponse.json(
    { message: 'Reset link generated', resetUrl },
    { status: 200 }
  )
}
