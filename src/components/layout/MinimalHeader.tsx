'use client'

import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'

export function MinimalHeader() {
  return (
    <nav className="sticky top-0 z-50 px-6 py-3">
      <GlassCard elevated className="flex items-center px-6 py-3">
        <Link
          href="/"
          className="shrink-0 font-display text-2xl font-bold tracking-tight text-white"
        >
          Mealio
        </Link>
      </GlassCard>
    </nav>
  )
}
