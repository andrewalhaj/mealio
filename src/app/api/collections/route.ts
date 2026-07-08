import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getSessionUserId()
  const collections = await db.collection.findMany({
    where: userId ? { userId } : { userId: null },
    include: {
      recipes: {
        include: {
          recipe: {
            include: { tags: { include: { tag: true } } }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json(collections)
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await req.json() as { name: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const collection = await db.collection.create({
    data: { name: name.trim(), userId }
  })
  return NextResponse.json(collection, { status: 201 })
}
