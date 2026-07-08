'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Grid2X2, List, Heart } from 'lucide-react'
import { RecipeCard, type RecipeCardData } from '@/components/ui/RecipeCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { GlassBadge } from '@/components/ui/GlassBadge'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import Link from 'next/link'

type SortOption = 'recent' | 'alpha' | 'rating' | 'time' | 'author'

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Recently added',
  alpha:  'A–Z',
  rating: 'Top rated',
  time:   'Quickest',
  author: 'By creator',
}

export function RecipeLibrary() {
  const [recipes, setRecipes]   = useState<RecipeCardData[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<SortOption>('recent')
  const [activeTag, setActiveTag]       = useState<string | null>(null)
  const [favorites, setFavorites]       = useState(false)
  const [viewMode, setViewMode]         = useState<'grid' | 'list'>('grid')
  const [tags, setTags]         = useState<string[]>([])

  const fetchRecipes = useCallback(async () => {
    setLoading(true)
    const sp = new URLSearchParams()
    if (search)       sp.set('search', search)
    if (sort)         sp.set('sort', sort)
    if (activeTag)    sp.set('tag', activeTag)
    if (favorites)    sp.set('favorites', 'true')
    const res = await fetch(`/api/recipes?${sp}`)
    const data = await res.json()
    setRecipes(
      (data as Array<Record<string, unknown>>).map((r) => ({
        id: r.id as string,
        title: r.title as string,
        heroImage: r.heroImage as string | null,
        totalTime: r.totalTime as number | null,
        difficulty: r.difficulty as string | null,
        rating: r.rating as number | null,
        dominantColor: r.dominantColor as string | null,
        tags: r.tags as string[],
        author: r.author as { id: string; email: string } | null | undefined,
        isFavorite: r.isFavorite as boolean | undefined,
      })),
    )
    setLoading(false)
  }, [search, sort, activeTag, favorites])

  useEffect(() => { fetchRecipes() }, [fetchRecipes])

  useEffect(() => {
    fetch('/api/tags').then(r => r.json()).then((t: { name: string }[]) =>
      setTags(t.map(x => x.name))
    )
  }, [])

  return (
    <div>
      {/* Search + controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            placeholder="Search recipes, ingredients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-glass-sm border border-glass-border bg-glass-white py-2.5 pl-9 pr-4 text-sm
                       text-white placeholder-white/40 outline-none focus:border-glass-border-strong focus:bg-glass-white-md
                       transition-all duration-200"
            style={{ backdropFilter: 'blur(16px)' }}
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-glass-sm border border-glass-border bg-glass-white px-3 py-2.5 text-sm text-white outline-none"
          style={{ backdropFilter: 'blur(16px)' }}
        >
          {Object.entries(SORT_LABELS).map(([k, v]) => (
            <option key={k} value={k} className="bg-brand-olive">{v}</option>
          ))}
        </select>

        {/* View mode */}
        <div className="flex rounded-glass-sm border border-glass-border overflow-hidden">
          <GlassButton
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none border-0"
            onClick={() => setViewMode('grid')}
          >
            <Grid2X2 className="h-4 w-4" />
          </GlassButton>
          <GlassButton
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none border-0 border-l border-glass-border"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </GlassButton>
        </div>

        {/* Favorites filter */}
        <GlassButton
          variant={favorites ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFavorites(f => !f)}
        >
          <Heart className={`h-4 w-4 ${favorites ? 'fill-current' : ''}`} />
          Favorites
        </GlassButton>
      </div>

      {/* Tag chips */}
      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveTag(null)}>
            <GlassBadge variant={!activeTag ? 'saffron' : 'default'}>All</GlassBadge>
          </button>
          {tags.slice(0, 12).map((t) => (
            <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}>
              <GlassBadge variant={activeTag === t ? 'basil' : 'default'}>{t}</GlassBadge>
            </button>
          ))}
        </div>
      )}

      {/* Grid / List */}
      {loading ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'flex flex-col gap-3'
        }>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className={viewMode === 'list' ? 'h-24' : ''} />)}
        </div>
      ) : recipes.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-white/60 text-lg">No recipes yet.</p>
          <Link href="/recipes/new">
            <GlassButton variant="primary">Add your first recipe</GlassButton>
          </Link>
        </GlassCard>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'flex flex-col gap-3'
        }>
          {recipes.map((recipe) =>
            viewMode === 'grid' ? (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ) : (
              <RecipeListRow key={recipe.id} recipe={recipe} />
            )
          )}
        </div>
      )}
    </div>
  )
}

function RecipeListRow({ recipe }: { recipe: RecipeCardData }) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <GlassCard className="flex items-center gap-4 px-5 py-4 hover:scale-[1.01] transition-transform">
        <div
          className="h-14 w-14 rounded-glass-sm flex-shrink-0"
          style={{ background: recipe.dominantColor ? `${recipe.dominantColor}44` : 'rgba(255,255,255,0.1)' }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-white truncate">{recipe.title}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
            {recipe.totalTime && <span>{recipe.totalTime}m</span>}
            {recipe.difficulty && <span className="capitalize">{recipe.difficulty}</span>}
            {recipe.tags?.slice(0, 3).map(t => <span key={t}>{t}</span>)}
          </div>
        </div>
        {recipe.rating && (
          <span className="text-brand-saffron font-mono text-sm">★ {recipe.rating}</span>
        )}
      </GlassCard>
    </Link>
  )
}
