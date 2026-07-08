import { notFound } from 'next/navigation'
import { getRecipeFull } from '@/lib/queries'
import { getSessionUserId } from '@/lib/auth'
import { RecipeEditor } from '@/components/recipes/RecipeEditor'

export default async function EditRecipePage({ params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  const recipe = await getRecipeFull(params.id, userId)
  if (!recipe) notFound()
  return (
    <RecipeEditor
      recipeId={recipe.id}
      initialData={{
        title: recipe.title,
        description: recipe.description ?? undefined,
        heroImage: recipe.heroImage ?? undefined,
        prepTime: recipe.prepTime ?? undefined,
        cookTime: recipe.cookTime ?? undefined,
        servings: recipe.servings ?? undefined,
        difficulty: recipe.difficulty ?? undefined,
        cuisine: recipe.cuisine ?? undefined,
        sourceUrl: recipe.sourceUrl ?? undefined,
        sourceAttr: recipe.sourceAttr ?? undefined,
        notes: recipe.notes ?? undefined,
        rating: recipe.rating ?? undefined,
        isFavorite: recipe.isFavorite,
        ingredients: recipe.ingredients.map((ing) => ({
          amount: ing.amount ?? undefined,
          unit: ing.unit ?? undefined,
          item: ing.item,
          order: ing.order,
        })),
        steps: recipe.steps.map((s) => ({
          text: s.text,
          order: s.order,
          timerMins: s.timerMins ?? undefined,
        })),
        tags: recipe.tags,
      }}
    />
  )
}
