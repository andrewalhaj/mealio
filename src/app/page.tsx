import { Suspense } from 'react'
import { RecipeLibrary } from '@/components/recipes/RecipeLibrary'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

export default function HomePage() {
  return (
    <div className="px-6 pb-16 pt-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white tracking-tight">
          Recipe Library
        </h1>
        <p className="mt-2 text-white/60">Your personal collection of culinary adventures.</p>
      </div>
      <Suspense fallback={
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      }>
        <RecipeLibrary />
      </Suspense>
    </div>
  )
}
