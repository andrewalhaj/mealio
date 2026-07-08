import { notFound } from 'next/navigation'
import { getRecipeFull } from '@/lib/queries'
import { CookMode } from '@/components/recipes/CookMode'

export default async function CookModePage({ params }: { params: { id: string } }) {
  const recipe = await getRecipeFull(params.id)
  if (!recipe) notFound()
  return (
    <CookMode
      recipe={{
        id: recipe.id,
        title: recipe.title,
        dominantColor: recipe.dominantColor ?? null,
        servings: recipe.servings ?? null,
        ingredients: recipe.ingredients.map(i => ({
          id: i.id,
          amount: i.amount ?? null,
          unit: i.unit ?? null,
          item: i.item,
        })),
        steps: recipe.steps.map(s => ({
          id: s.id,
          order: s.order,
          text: s.text,
          timerMins: s.timerMins ?? null,
        })),
      }}
    />
  )
}
