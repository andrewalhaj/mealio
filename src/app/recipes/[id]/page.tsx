import { notFound } from 'next/navigation'
import { getRecipeFull } from '@/lib/queries'
import { getSessionUserId } from '@/lib/auth'
import { RecipeDetail } from '@/components/recipes/RecipeDetail'

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  const recipe = await getRecipeFull(params.id, userId)
  if (!recipe) notFound()
  return <RecipeDetail recipe={recipe} />
}
