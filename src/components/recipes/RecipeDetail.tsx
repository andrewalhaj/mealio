'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, Heart, ExternalLink, Edit, ChefHat, Trash2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassBadge } from '@/components/ui/GlassBadge'
import { GlassModal } from '@/components/ui/GlassModal'
import { CollectionPicker } from './CollectionPicker'
import { ShareButton } from './ShareButton'

interface RecipeDetailProps {
  recipe: {
    id: string
    title: string
    description: string | null
    heroImage: string | null
    prepTime: number | null
    cookTime: number | null
    difficulty: string | null
    cuisine: string | null
    rating: number | null
    isFavorite: boolean
    dominantColor: string | null
    servings: number | null
    sourceUrl: string | null
    sourceAttr: string | null
    notes: string | null
    tags: string[]
    shareSlug?: string | null
    ingredients: { id: string; amount: string | null; unit: string | null; item: string; order: number }[]
    steps: { id: string; order: number; text: string; timerMins: number | null }[]
    author?: { id: string; email: string; firstName?: string | null; lastName?: string | null } | null
  }
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const router = useRouter()
  const [servingsMultiplier, setServingsMultiplier] = useState(1)
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Delete failed')
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  const scaleAmount = (amount: string | null | undefined) => {
    if (!amount) return amount
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    const scaled = num * servingsMultiplier
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1)
  }

  const toggleIngredient = (id: string) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleFavorite = async () => {
    const res = await fetch(`/api/recipes/${recipe.id}/favorite`, { method: 'POST' })
    const data = await res.json() as { isFavorite: boolean }
    setIsFavorite(data.isFavorite)
  }

  return (
    <div
      className="min-h-screen pb-16"
      style={recipe.dominantColor ? {
        background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${recipe.dominantColor}33 0%, transparent 60%)`
      } : undefined}
    >
      {/* Hero */}
      <div className="relative h-72 md:h-96 w-full">
        {recipe.heroImage ? (
          <Image src={recipe.heroImage} alt={recipe.title} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0" style={{
            background: recipe.dominantColor
              ? `linear-gradient(135deg, ${recipe.dominantColor}66, ${recipe.dominantColor}22)`
              : 'linear-gradient(135deg, rgba(192,57,43,0.4), rgba(230,126,34,0.2))'
          }} />
        )}
        {/* Bottom frost */}
        <div className="absolute bottom-0 left-0 right-0 h-32"
          style={{
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            background: 'rgba(255,255,255,0.10)',
            maskImage: 'linear-gradient(to bottom, transparent, black)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)',
          }} />
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 relative z-10">
        <GlassCard elevated className="px-8 py-6 mb-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
              {recipe.title}
            </h1>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <GlassButton variant="ghost" size="sm" onClick={handleFavorite} aria-label="Toggle favorite">
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-brand-tomato text-brand-tomato' : ''}`} />
              </GlassButton>
              <Link href={`/recipes/${recipe.id}/edit`}>
                <GlassButton variant="ghost" size="sm"><Edit className="h-4 w-4" /></GlassButton>
              </Link>
              <CollectionPicker recipeId={recipe.id} />
              <ShareButton recipeId={recipe.id} shareSlug={recipe.shareSlug ?? null} />
              <GlassButton variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} aria-label="Delete recipe">
                <Trash2 className="h-4 w-4 text-brand-tomato" />
              </GlassButton>
            </div>
          </div>

          <GlassModal open={confirmDelete} onClose={() => !deleting && setConfirmDelete(false)} title="Delete recipe?">
            <p className="text-white/75 mb-1">
              <span className="font-semibold text-white">{recipe.title}</span> will be permanently deleted.
            </p>
            <p className="text-white/60 text-sm mb-5">This removes it from all collections and meal plans. This cannot be undone.</p>
            {deleteError && <p className="text-sm text-brand-tomato mb-3">{deleteError}</p>}
            <div className="flex justify-end gap-3">
              <GlassButton variant="ghost" size="md" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancel
              </GlassButton>
              <GlassButton variant="danger" size="md" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete recipe'}
              </GlassButton>
            </div>
          </GlassModal>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.tags.map((t) => <GlassBadge key={t}>{t}</GlassBadge>)}
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {recipe.prepTime && (
              <div className="text-center">
                <p className="text-xs text-white/50 uppercase tracking-wide">Prep</p>
                <p className="font-mono text-brand-saffron text-lg font-bold">{recipe.prepTime}m</p>
              </div>
            )}
            {recipe.cookTime && (
              <div className="text-center">
                <p className="text-xs text-white/50 uppercase tracking-wide">Cook</p>
                <p className="font-mono text-brand-saffron text-lg font-bold">{recipe.cookTime}m</p>
              </div>
            )}
            {recipe.difficulty && (
              <div className="text-center">
                <p className="text-xs text-white/50 uppercase tracking-wide">Difficulty</p>
                <p className="text-white capitalize font-medium">{recipe.difficulty}</p>
              </div>
            )}
            {recipe.rating && (
              <div className="text-center">
                <p className="text-xs text-white/50 uppercase tracking-wide">Rating</p>
                <p className="text-brand-saffron font-bold">{'★'.repeat(recipe.rating)}</p>
              </div>
            )}
          </div>

          {recipe.description && (
            <p className="text-white/70 text-sm leading-relaxed">{recipe.description}</p>
          )}
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ingredients panel */}
          <GlassCard className="p-6 md:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-white">Ingredients</h2>
              {recipe.servings && (
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => setServingsMultiplier(m => Math.max(0.5, m - 0.5))}
                    className="w-6 h-6 rounded-full border border-glass-border bg-glass-white text-white hover:bg-glass-white-md flex items-center justify-center"
                    style={{ backdropFilter: 'blur(16px)' }}
                  >−</button>
                  <span className="font-mono text-brand-saffron">
                    {Math.round(recipe.servings * servingsMultiplier)} srv
                  </span>
                  <button
                    onClick={() => setServingsMultiplier(m => m + 0.5)}
                    className="w-6 h-6 rounded-full border border-glass-border bg-glass-white text-white hover:bg-glass-white-md flex items-center justify-center"
                    style={{ backdropFilter: 'blur(16px)' }}
                  >+</button>
                </div>
              )}
            </div>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id}
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={() => toggleIngredient(ing.id)}
                >
                  <span className={`mt-0.5 h-4 w-4 rounded border border-glass-border flex-shrink-0 flex items-center justify-center transition-colors ${
                    checkedIngredients.has(ing.id) ? 'bg-brand-basil border-brand-basil' : 'bg-glass-white'
                  }`} style={{ backdropFilter: 'blur(16px)' }}>
                    {checkedIngredients.has(ing.id) && <span className="text-[8px] text-white">✓</span>}
                  </span>
                  <span className={`text-sm transition-opacity ${checkedIngredients.has(ing.id) ? 'opacity-40 line-through' : ''}`}>
                    {ing.amount && <span className="font-mono text-brand-saffron">{scaleAmount(ing.amount)}</span>}
                    {ing.unit && <span className="font-mono text-brand-saffron"> {ing.unit}</span>}
                    {' '}<span className="text-white">{ing.item}</span>
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Steps */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="font-display text-xl font-bold text-white mb-4">Instructions</h2>
            {recipe.steps.map((step, i) => (
              <GlassCard key={step.id} className="p-5">
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full border border-glass-border bg-glass-white flex items-center justify-center font-mono text-sm text-brand-saffron font-bold"
                    style={{ backdropFilter: 'blur(16px)' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-white/90 leading-relaxed">{step.text}</p>
                    {step.timerMins && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-brand-saffron font-mono">
                        <Clock className="h-3 w-3" /> {step.timerMins} min
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}

            {/* Source attribution */}
            {recipe.sourceAttr && (
              <GlassCard className="p-4 flex items-center gap-2 text-sm text-white/60">
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span>{recipe.sourceAttr}</span>
                {recipe.sourceUrl && (
                  <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-auto text-brand-saffron hover:underline truncate max-w-xs">
                    View source
                  </a>
                )}
              </GlassCard>
            )}

            {/* Author attribution */}
            {recipe.author && (
              <p className="mt-1 text-sm text-white/60 flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/20 text-[10px] font-bold uppercase">
                  {recipe.author.firstName
                    ? `${recipe.author.firstName.charAt(0)}${recipe.author.lastName?.charAt(0) ?? ''}`
                    : recipe.author.email.charAt(0)}
                </span>
                Added by {recipe.author.firstName ? `${recipe.author.firstName} ${recipe.author.lastName ?? ''}`.trim() : recipe.author.email}
              </p>
            )}

            {/* Notes */}
            {recipe.notes && (
              <GlassCard className="p-5">
                <h3 className="font-display font-bold text-white mb-2">Notes</h3>
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{recipe.notes}</p>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Start Cooking CTA */}
        <div className="mt-8 flex justify-center">
          <Link href={`/recipes/${recipe.id}/cook`}>
            <GlassButton variant="primary" size="lg" className="px-10">
              <ChefHat className="h-5 w-5" />
              Start Cooking
            </GlassButton>
          </Link>
        </div>
      </div>
    </div>
  )
}
