import { NextRequest, NextResponse } from 'next/server'
import { getRecipeFull, updateRecipe, deleteRecipe } from '@/lib/queries'
import { recipeSchema } from '@/lib/validation'
import { getSessionUserId } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  const recipe = await getRecipeFull(params.id, userId)
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = recipeSchema.parse(body)
    try {
      const recipe = await updateRecipe(params.id, data, userId)
      return NextResponse.json(recipe)
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      throw e
    }
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'errors' in e) {
      return NextResponse.json({ error: 'Validation error', details: (e as { errors: unknown }).errors }, { status: 400 })
    }
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
      await deleteRecipe(params.id, userId)
      return NextResponse.json({ ok: true })
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      throw e
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
