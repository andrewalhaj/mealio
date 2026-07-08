import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  const entry = await db.mealPlanEntry.findUnique({ where: { id: params.id } })
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (entry.userId && entry.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await db.mealPlanEntry.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
