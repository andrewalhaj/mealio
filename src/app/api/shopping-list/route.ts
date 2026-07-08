import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

const AISLES: Array<{ name: string; keywords: string[] }> = [
  { name: 'Produce',        keywords: ['onion','garlic','tomato','basil','carrot','celery','lemon','lime','pepper','lettuce','spinach','herb','potato','apple','mushroom','ginger','cilantro','parsley','rosemary','thyme','scallion','cucumber','avocado','chili','fruit','berry'] },
  { name: 'Meat & Seafood', keywords: ['chicken','beef','pork','lamb','fish','salmon','shrimp','pancetta','bacon','sausage','turkey','steak','mince','thigh','shank','breast'] },
  { name: 'Dairy & Eggs',   keywords: ['milk','butter','cheese','cream','yogurt','egg','parmesan','mozzarella','cheddar','feta'] },
  { name: 'Pantry',         keywords: ['rice','pasta','flour','sugar','oil','vinegar','stock','broth','canned','bean','lentil','spice','salt','sauce','wine','noodle','grain','oat','honey','tin'] },
  { name: 'Bakery',         keywords: ['bread','baguette','roll','tortilla','pita'] },
]

function classifyAisle(item: string): string {
  const lower = item.toLowerCase()
  for (const aisle of AISLES) {
    if (aisle.keywords.some(k => lower.includes(k))) return aisle.name
  }
  return 'Other'
}

export async function GET(req: NextRequest) {
  const start = req.nextUrl.searchParams.get('start')
  const end = req.nextUrl.searchParams.get('end')
  if (!start || !end) return NextResponse.json({ error: 'start and end required' }, { status: 400 })

  const userId = await getSessionUserId()
  const entries = await db.mealPlanEntry.findMany({
    where: { date: { gte: start, lte: end }, userId: userId ?? undefined },
    include: { recipe: { include: { ingredients: true } } },
  })

  const merged = new Map<string, { item: string; unit: string | null; amounts: number[]; nonNumeric: string[]; recipes: Set<string> }>()

  for (const entry of entries) {
    for (const ing of entry.recipe.ingredients) {
      const key = `${ing.item.toLowerCase().trim()}|${(ing.unit ?? '').toLowerCase().trim()}`
      if (!merged.has(key)) {
        merged.set(key, { item: ing.item, unit: ing.unit, amounts: [], nonNumeric: [], recipes: new Set() })
      }
      const m = merged.get(key)!
      m.recipes.add(entry.recipe.title)
      const num = parseFloat(ing.amount ?? '')
      if (!isNaN(num)) m.amounts.push(num)
      else if (ing.amount) m.nonNumeric.push(ing.amount)
    }
  }

  const grouped: Record<string, Array<{ item: string; unit: string | null; totalAmount: number | null; note: string | null; recipes: string[] }>> = {}
  merged.forEach((v) => {
    const aisle = classifyAisle(v.item)
    if (!grouped[aisle]) grouped[aisle] = []
    grouped[aisle].push({
      item: v.item,
      unit: v.unit,
      totalAmount: v.amounts.length ? v.amounts.reduce((a, b) => a + b, 0) : null,
      note: v.nonNumeric.length ? v.nonNumeric.join(', ') : null,
      recipes: Array.from(v.recipes),
    })
  })
  Object.values(grouped).forEach(list => list.sort((a, b) => a.item.localeCompare(b.item)))

  return NextResponse.json(grouped)
}
