import { z } from 'zod'

// NOTE: import extraction (LLM) emits `null` for absent values — every optional
// field must be .nullish() (null | undefined), not just .optional().
export const ingredientSchema = z.object({
  id:     z.string().optional(),
  amount: z.string().nullish(),
  unit:   z.string().nullish(),
  item:   z.string().min(1, 'Ingredient name required'),
  order:  z.number().int(),
})

export const stepSchema = z.object({
  id:        z.string().optional(),
  order:     z.number().int(),
  text:      z.string().min(1, 'Step text required'),
  timerMins: z.number().int().positive().nullish(),
})

export const recipeSchema = z.object({
  title:       z.string().min(1, 'Title required').max(200),
  description: z.string().max(2000).nullish(),
  heroImage:   z.string().url().nullish().or(z.literal('')),
  prepTime:    z.number().int().nonnegative().nullish(),
  cookTime:    z.number().int().nonnegative().nullish(),
  servings:    z.number().int().positive().nullish(),
  difficulty:  z.enum(['easy', 'medium', 'hard']).nullish(),
  cuisine:     z.string().max(100).nullish(),
  sourceUrl:   z.string().url().nullish().or(z.literal('')),
  sourceAttr:  z.string().max(200).nullish(),
  notes:       z.string().max(5000).nullish(),
  rating:      z.number().int().min(1).max(5).nullish(),
  isFavorite:  z.boolean().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient required'),
  steps:       z.array(stepSchema),
  tags:        z.array(z.string().min(1)).default([]),
})
