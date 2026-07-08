'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Heart, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'

function authorInitials(a: { email: string; firstName?: string | null; lastName?: string | null }) {
  if (a.firstName || a.lastName) return `${a.firstName?.charAt(0) ?? ''}${a.lastName?.charAt(0) ?? ''}`
  return a.email.charAt(0)
}

export interface RecipeCardData {
  id: string
  title: string
  heroImage?: string | null
  totalTime?: number | null
  difficulty?: string | null
  rating?: number | null
  tags?: string[]
  dominantColor?: string | null
  author?: { id: string; email: string; firstName?: string | null; lastName?: string | null } | null
  isFavorite?: boolean
}

interface RecipeCardProps {
  recipe: RecipeCardData
  className?: string
}

export function RecipeCard({ recipe, className }: RecipeCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={`/recipes/${recipe.id}`} className="block focus-visible:outline-none group">
      <GlassCard
        disableSpecular // card manages its own specular via the image overlay
        className={cn(
          'relative h-72 cursor-pointer overflow-hidden',
          'transition-transform duration-300 ease-spring',
          'hover:scale-[1.02] hover:shadow-glass-lg',
          'focus-within:scale-[1.02]',
          className,
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: recipe.dominantColor
            ? `linear-gradient(135deg, ${recipe.dominantColor}44, ${recipe.dominantColor}22)`
            : undefined,
        }}
      >
        {/* Food photo — behind the glass, full saturation */}
        {recipe.heroImage ? (
          <Image
            src={recipe.heroImage}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-tomato-muted/30 via-brand-saffron-muted/20 to-brand-basil-muted/25" />
        )}

        {/* Favorite heart badge */}
        {recipe.isFavorite && (
          <div className="absolute top-3 left-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-sm shadow-sm">
            <Heart className="h-3.5 w-3.5 fill-brand-tomato text-brand-tomato" />
          </div>
        )}

        {/* Author badge */}
        {recipe.author && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-sm text-white text-xs font-bold uppercase shadow-sm"
              title={recipe.author.firstName ? `${recipe.author.firstName} ${recipe.author.lastName ?? ''}`.trim() : recipe.author.email}
            >
              {authorInitials(recipe.author)}
            </div>
          </div>
        )}

        {/* Frost overlay — covers lower portion, "melts" up on hover */}
        <div
          className={cn(
            'absolute inset-0 glass transition-none',
            hovered ? 'animate-frost-reveal' : 'animate-frost-hide',
          )}
          style={{
            clipPath: hovered
              ? 'inset(30% 0 0 0 round 0 0 24px 24px)'
              : 'inset(55% 0 0 0 round 0 0 24px 24px)',
          }}
        />

        {/* Content etched into the frost */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-glass-border bg-glass-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="font-display text-lg font-bold leading-tight text-white text-glass-readable line-clamp-2">
            {recipe.title}
          </h3>

          {/* Meta row */}
          <div className="mt-2 flex items-center gap-3 text-white/75 text-xs">
            {recipe.totalTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {recipe.totalTime}m
              </span>
            )}
            {recipe.difficulty && (
              <span className="capitalize">{recipe.difficulty}</span>
            )}
            {recipe.rating && (
              <span className="ml-auto flex items-center gap-1">
                <Star className="h-3 w-3 fill-brand-saffron text-brand-saffron" />
                {recipe.rating}/5
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
