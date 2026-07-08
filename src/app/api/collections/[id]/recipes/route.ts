import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  const collection = await db.collection.findUnique({ where: { id: params.id } })
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (collection.userId && collection.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { recipeId } = await req.json() as { recipeId: string }
  await db.recipeCollection.upsert({
    where: { recipeId_collectionId: { recipeId, collectionId: params.id } },
    update: {},
    create: { recipeId, collectionId: params.id }
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  const collection = await db.collection.findUnique({ where: { id: params.id } })
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (collection.userId && collection.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { recipeId } = await req.json() as { recipeId: string }
  await db.recipeCollection.delete({
    where: { recipeId_collectionId: { recipeId, collectionId: params.id } }
  })
  return NextResponse.json({ ok: true })
}
