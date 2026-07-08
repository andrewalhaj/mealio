import { NextRequest, NextResponse } from 'next/server'
import { toggleFavorite } from '@/lib/queries'
import { getSessionUserId } from '@/lib/auth'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await toggleFavorite(params.id, userId)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
