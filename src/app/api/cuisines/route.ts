export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAllCuisines } from '@/lib/queries'

export async function GET() {
  const cuisines = await getAllCuisines()
  return NextResponse.json(cuisines)
}
