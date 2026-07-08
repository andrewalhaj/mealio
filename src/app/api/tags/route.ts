export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAllTags } from '@/lib/queries'

export async function GET() {
  const tags = await getAllTags()
  return NextResponse.json(tags)
}
