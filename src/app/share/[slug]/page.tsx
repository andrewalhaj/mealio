import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassBadge } from '@/components/ui/GlassBadge'

export default async function SharedRecipePage({ params }: { params: { slug: string } }) {
  const recipe = await db.recipe.findUnique({
    where: { shareSlug: params.slug },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
      tags: { include: { tag: true } },
    },
  })
  if (!recipe) notFound()

  return (
    <div className="px-6 pb-16 pt-8 max-w-3xl mx-auto print:text-black">
      <GlassCard elevated className="p-8 print:border-0 print:shadow-none">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2 print:text-gray-500">Shared from Mealio</p>
        <h1 className="font-display text-4xl font-bold text-white mb-3 print:text-black">{recipe.title}</h1>
        {recipe.description && <p className="text-white/70 mb-4 print:text-gray-700">{recipe.description}</p>}
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.tags.map(t => <GlassBadge key={t.tagId}>{t.tag.name}</GlassBadge>)}
        </div>
        <div className="flex gap-6 mb-8 font-mono text-sm text-brand-saffron print:text-gray-800">
          {recipe.prepTime ? <span>Prep {recipe.prepTime}m</span> : null}
          {recipe.cookTime ? <span>Cook {recipe.cookTime}m</span> : null}
          {recipe.servings ? <span>Serves {recipe.servings}</span> : null}
        </div>
        <h2 className="font-display text-xl font-bold text-white mb-3 print:text-black">Ingredients</h2>
        <ul className="mb-8 space-y-1.5">
          {recipe.ingredients.map(ing => (
            <li key={ing.id} className="text-sm text-white/85 print:text-gray-800">
              <span className="font-mono text-brand-saffron print:text-gray-600">{ing.amount} {ing.unit}</span> {ing.item}
            </li>
          ))}
        </ul>
        <h2 className="font-display text-xl font-bold text-white mb-3 print:text-black">Instructions</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step, i) => (
            <li key={step.id} className="flex gap-3 text-sm text-white/85 print:text-gray-800">
              <span className="font-mono font-bold text-brand-saffron shrink-0 print:text-gray-600">{i + 1}.</span>
              <span className="leading-relaxed">{step.text}</span>
            </li>
          ))}
        </ol>
        {recipe.sourceAttr && (
          <p className="mt-8 text-xs text-white/40 print:text-gray-500">{recipe.sourceAttr}</p>
        )}
      </GlassCard>
    </div>
  )
}
