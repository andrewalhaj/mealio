import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  const collection = await db.collection.findUnique({ where: { id: params.id } })
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (collection.userId && collection.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await db.collection.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
