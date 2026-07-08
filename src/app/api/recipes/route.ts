import { NextRequest, NextResponse } from 'next/server'
import { listRecipes, createRecipe } from '@/lib/queries'
import { recipeSchema } from '@/lib/validation'
import { getSessionUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  try {
    const userId = await getSessionUserId()
    const recipes = await listRecipes({
      search:    sp.get('search') ?? undefined,
      tag:       sp.get('tag') ?? undefined,
      cuisine:   sp.get('cuisine') ?? undefined,
      maxTime:   sp.has('maxTime') ? Number(sp.get('maxTime')) : undefined,
      favorites: sp.get('favorites') === 'true',
      sort:      (sp.get('sort') as 'recent' | 'alpha' | 'rating' | 'time' | 'author') ?? 'recent',
      userId,
    })
    return NextResponse.json(recipes)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = recipeSchema.parse(body)
    const authorId = await getSessionUserId()
    const recipe = await createRecipe(data, authorId)
    return NextResponse.json(recipe, { status: 201 })
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'errors' in e) {
      const details = (e as { errors: Array<{ path: string[]; message: string }> }).errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('; ')
      return NextResponse.json({ error: `Validation error — ${details || 'check fields'}` }, { status: 400 })
    }
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
