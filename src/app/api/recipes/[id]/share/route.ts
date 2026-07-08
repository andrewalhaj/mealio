import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.recipe.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  })
  if (!existing || existing.authorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 404 })
  }

  const slug = randomBytes(6).toString('base64url')
  const recipe = await db.recipe.update({ where: { id: params.id }, data: { shareSlug: slug } })
  return NextResponse.json({ shareSlug: recipe.shareSlug })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.recipe.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  })
  if (!existing || existing.authorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 404 })
  }

  await db.recipe.update({ where: { id: params.id }, data: { shareSlug: null } })
  return NextResponse.json({ ok: true })
}
