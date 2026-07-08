import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId()
  const start = req.nextUrl.searchParams.get('start')
  const end = req.nextUrl.searchParams.get('end')
  const entries = await db.mealPlanEntry.findMany({
    where: {
      userId: userId ?? undefined,
      ...(start && end ? { date: { gte: start, lte: end } } : {}),
    },
    include: { recipe: { select: { id: true, title: true, totalTime: true, dominantColor: true } } },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { date, recipeId, mealType } = await req.json() as { date: string; recipeId: string; mealType?: string }
  if (!date || !recipeId) return NextResponse.json({ error: 'date and recipeId required' }, { status: 400 })
  const entry = await db.mealPlanEntry.create({
    data: { date, recipeId, mealType: mealType ?? 'dinner', userId },
    include: { recipe: { select: { id: true, title: true, totalTime: true, dominantColor: true } } },
  })
  return NextResponse.json(entry, { status: 201 })
}
