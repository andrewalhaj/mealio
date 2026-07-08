import type { Prisma } from '@prisma/client'
import type { z } from 'zod'
import type { recipeSchema, ingredientSchema, stepSchema } from './validation'

// Derived from the Zod schemas — single source of truth, can't drift.
export type IngredientInput = z.infer<typeof ingredientSchema>
export type StepInput = z.infer<typeof stepSchema>
export type RecipeFormData = z.infer<typeof recipeSchema>

export type RecipeFull = Prisma.RecipeGetPayload<{
  include: {
    ingredients: { orderBy: { order: 'asc' } }
    steps: { orderBy: { order: 'asc' } }
    tags: { include: { tag: true } }
    collections: { include: { collection: true } }
  }
}> & { tags: string[]; collections: { id: string; name: string }[]; gallery: string[] } | null

export interface RecipeListItem {
  id: string
  title: string
  description: string | null
  heroImage: string | null
  prepTime: number | null
  cookTime: number | null
  totalTime: number | null
  servings: number | null
  difficulty: string | null
  cuisine: string | null
  rating: number | null
  isFavorite: boolean
  dominantColor: string | null
  createdAt: Date
  updatedAt: Date
  tags: string[]
  _count: { ingredients: number; steps: number }
}
