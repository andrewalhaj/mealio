import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true, lastName: true, createdAt: true } })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { firstName, lastName } = await req.json() as { firstName?: string; lastName?: string }
  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: 'First and last name required' }, { status: 400 })
  }
  const user = await db.user.update({
    where: { id: userId },
    data: { firstName: firstName.trim(), lastName: lastName.trim() },
    select: { email: true, firstName: true, lastName: true, createdAt: true },
  })
  return NextResponse.json(user)
}
