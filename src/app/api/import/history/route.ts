export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getSessionUserId()
  const history = await db.importHistory.findMany({
    where: userId ? { userId } : { userId: null },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(history)
}
