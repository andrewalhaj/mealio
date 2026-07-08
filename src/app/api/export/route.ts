export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const recipes = await db.recipe.findMany({
    where: { authorId: userId },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
      tags: { include: { tag: true } },
      collections: { include: { collection: true } },
    },
  })
  const exportData = {
    app: 'mealio',
    version: '0.1.0',
    exportedAt: new Date().toISOString(),
    recipes: recipes.map(r => ({
      ...r,
      tags: r.tags.map(t => t.tag.name),
      collections: r.collections.map(c => c.collection.name),
      mealPlans: undefined, // dont export meal plans
    })),
  }
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="mealio-export-${new Date().toISOString().slice(0,10)}.json"`,
    },
  })
}
