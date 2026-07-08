import { db } from './db'
import type { RecipeFormData } from './types'

export async function listRecipes(opts?: {
  search?: string
  tag?: string
  cuisine?: string
  maxTime?: number
  favorites?: boolean
  sort?: 'recent' | 'alpha' | 'rating' | 'time' | 'author'
  userId?: string | null
}) {
  const { search, tag, cuisine, maxTime, favorites, sort = 'recent', userId } = opts ?? {}

  if (!userId) return []

  const recipes = await db.recipe.findMany({
    where: {
      authorId: userId,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { ingredients: { some: { item: { contains: search } } } },
          { tags: { some: { tag: { name: { contains: search } } } } },
        ],
      }),
      ...(tag && { tags: { some: { tag: { name: tag } } } }),
      ...(cuisine && { cuisine }),
      ...(maxTime && { totalTime: { lte: maxTime } }),
      ...(favorites && userId && { favoritedBy: { some: { userId } } }),
    },
    include: {
      tags: { include: { tag: true } },
      author: { select: { id: true, email: true, firstName: true, lastName: true } },
      favoritedBy: { select: { userId: true } },
      _count: { select: { ingredients: true, steps: true } },
    },
    orderBy:
      sort === 'alpha'  ? { title: 'asc' } :
      sort === 'rating' ? { rating: 'desc' } :
      sort === 'time'   ? { totalTime: 'asc' } :
      sort === 'author' ? { author: { email: 'asc' } } :
      { createdAt: 'desc' },
  })

  return recipes.map((r) => ({
    ...r,
    tags: r.tags.map((t) => t.tag.name),
    author: r.author,
    isFavorite: userId ? r.favoritedBy.some(f => f.userId === userId) : false,
    favoritedBy: undefined,
  }))
}

export async function getRecipeFull(id: string, userId?: string | null) {
  const recipe = await db.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      steps:       { orderBy: { order: 'asc' } },
      tags:        { include: { tag: true } },
      collections: { include: { collection: true } },
      author:      { select: { id: true, email: true, firstName: true, lastName: true } },
      favoritedBy: { select: { userId: true } },
    },
  })
  if (!recipe || (userId && recipe.authorId !== userId)) return null
  return {
    ...recipe,
    gallery: JSON.parse(recipe.gallery ?? '[]') as string[],
    tags: recipe.tags.map((t) => t.tag.name),
    collections: recipe.collections.map((c) => c.collection),
    isFavorite: userId ? recipe.favoritedBy.some(f => f.userId === userId) : false,
    favoritedBy: undefined,
  }
}

export async function createRecipe(data: RecipeFormData, authorId?: string | null) {
  const { ingredients, steps, tags, isFavorite: _fav, ...rest } = data

  // upsert tags
  const tagRecords = await Promise.all(
    tags.map((name) =>
      db.tag.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  )

  return db.recipe.create({
    data: {
      ...rest,
      ...(authorId && { authorId }),
      totalTime: (rest.prepTime ?? 0) + (rest.cookTime ?? 0) || undefined,
      ingredients: {
        create: ingredients.map((ing) => ({
          amount: ing.amount,
          unit: ing.unit,
          item: ing.item,
          order: ing.order,
        })),
      },
      steps: {
        create: steps.map((s) => ({
          order: s.order,
          text: s.text,
          timerMins: s.timerMins,
        })),
      },
      tags: {
        create: tagRecords.map((t) => ({ tagId: t.id })),
      },
    },
  })
}

export async function updateRecipe(id: string, data: RecipeFormData, userId?: string | null) {
  if (userId) {
    const existing = await db.recipe.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!existing || existing.authorId !== userId) {
      throw new Error('FORBIDDEN')
    }
  }

  const { ingredients, steps, tags, isFavorite: _fav, ...rest } = data

  const tagRecords = await Promise.all(
    tags.map((name) =>
      db.tag.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  )

  // delete existing child records and re-create
  await db.ingredient.deleteMany({ where: { recipeId: id } })
  await db.step.deleteMany({ where: { recipeId: id } })
  await db.recipeTag.deleteMany({ where: { recipeId: id } })

  return db.recipe.update({
    where: { id },
    data: {
      ...rest,
      totalTime: (rest.prepTime ?? 0) + (rest.cookTime ?? 0) || undefined,
      ingredients: {
        create: ingredients.map((ing) => ({
          amount: ing.amount,
          unit: ing.unit,
          item: ing.item,
          order: ing.order,
        })),
      },
      steps: {
        create: steps.map((s) => ({
          order: s.order,
          text: s.text,
          timerMins: s.timerMins,
        })),
      },
      tags: {
        create: tagRecords.map((t) => ({ tagId: t.id })),
      },
    },
  })
}

export async function deleteRecipe(id: string, userId?: string | null) {
  if (userId) {
    const existing = await db.recipe.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!existing || existing.authorId !== userId) {
      throw new Error('FORBIDDEN')
    }
  }
  return db.recipe.delete({ where: { id } })
}

export async function toggleFavorite(id: string, userId: string) {
  const existing = await db.userFavorite.findUnique({
    where: { userId_recipeId: { userId, recipeId: id } },
  })
  if (existing) {
    await db.userFavorite.delete({
      where: { userId_recipeId: { userId, recipeId: id } },
    })
    return { isFavorite: false }
  } else {
    await db.userFavorite.create({
      data: { userId, recipeId: id },
    })
    return { isFavorite: true }
  }
}

export async function getAllTags() {
  return db.tag.findMany({ orderBy: { name: 'asc' } })
}

export async function getAllCuisines() {
  const recipes = await db.recipe.findMany({
    select: { cuisine: true },
    where: { cuisine: { not: null } },
    distinct: ['cuisine'],
  })
  return recipes.map((r) => r.cuisine!).sort()
}
