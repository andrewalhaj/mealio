import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const recipes = [
    {
      title: 'Saffron Risotto with Crispy Pancetta',
      description: 'A luxurious Italian classic with golden threads of saffron, slowly stirred arborio rice, and crispy pancetta bites.',
      prepTime: 10, cookTime: 35, servings: 4,
      difficulty: 'medium', cuisine: 'Italian',
      dominantColor: '#d4a017', rating: 5, isFavorite: true,
      ingredients: [
        { amount: '300', unit: 'g', item: 'arborio rice', order: 1 },
        { amount: '1', unit: 'litre', item: 'warm chicken stock', order: 2 },
        { amount: '1', unit: 'pinch', item: 'saffron threads', order: 3 },
        { amount: '150', unit: 'g', item: 'pancetta cubes', order: 4 },
        { amount: '1', unit: 'medium', item: 'white onion, finely diced', order: 5 },
        { amount: '100', unit: 'ml', item: 'dry white wine', order: 6 },
        { amount: '60', unit: 'g', item: 'parmesan, grated', order: 7 },
        { amount: '30', unit: 'g', item: 'unsalted butter', order: 8 },
      ],
      steps: [
        { order: 1, text: 'Bloom the saffron in 2 tbsp of warm stock for 10 minutes.' },
        { order: 2, text: 'Fry pancetta in a dry pan until crispy. Set aside.' },
        { order: 3, text: 'Soften onion in butter over medium heat, 5 minutes.' },
        { order: 4, text: 'Add rice and toast 2 minutes until translucent at edges.' },
        { order: 5, text: 'Add wine and stir until absorbed.' },
        { order: 6, text: 'Add stock ladle by ladle, stirring constantly. Add saffron stock with the third ladle.' },
        { order: 7, text: 'After 18–20 min when rice is al dente, remove from heat. Stir in butter and parmesan.' },
        { order: 8, text: 'Rest 1 min, then plate and top with crispy pancetta.' },
      ],
      tags: ['Italian', 'Dinner', 'Rice', 'Comfort'],
    },
    {
      title: 'Charred Basil Chicken Thighs',
      description: 'Quick weeknight chicken thighs with a punchy basil and garlic marinade, charred under the grill.',
      prepTime: 10, cookTime: 20, servings: 2,
      difficulty: 'easy', cuisine: 'Mediterranean',
      dominantColor: '#2d7a45', rating: 4, isFavorite: false,
      ingredients: [
        { amount: '4', unit: '', item: 'bone-in chicken thighs', order: 1 },
        { amount: '1', unit: 'bunch', item: 'fresh basil', order: 2 },
        { amount: '3', unit: 'cloves', item: 'garlic', order: 3 },
        { amount: '2', unit: 'tbsp', item: 'olive oil', order: 4 },
        { amount: '1', unit: 'tbsp', item: 'lemon juice', order: 5 },
        { amount: '1', unit: 'tsp', item: 'chilli flakes', order: 6 },
      ],
      steps: [
        { order: 1, text: 'Blend basil, garlic, olive oil, lemon juice, and chilli into a paste.' },
        { order: 2, text: 'Score the chicken thighs and coat in the marinade. Rest 30 min (or overnight).' },
        { order: 3, text: 'Grill on high heat 8 min per side until charred and cooked through.' },
      ],
      tags: ['Chicken', 'Weeknight', 'Grill', 'Quick'],
    },
    {
      title: 'Slow-Braised Tomato Lamb Shank',
      description: 'Fall-off-the-bone lamb shanks braised low and slow in a rich tomato and red wine sauce.',
      prepTime: 20, cookTime: 180, servings: 2,
      difficulty: 'hard', cuisine: 'French',
      dominantColor: '#8b2020', rating: 5, isFavorite: true,
      ingredients: [
        { amount: '2', unit: '', item: 'lamb shanks', order: 1 },
        { amount: '400', unit: 'g', item: 'canned crushed tomatoes', order: 2 },
        { amount: '250', unit: 'ml', item: 'red wine', order: 3 },
        { amount: '2', unit: 'sticks', item: 'celery', order: 4 },
        { amount: '2', unit: 'medium', item: 'carrots', order: 5 },
        { amount: '1', unit: 'head', item: 'garlic, halved', order: 6 },
        { amount: '2', unit: 'sprigs', item: 'fresh rosemary', order: 7 },
      ],
      steps: [
        { order: 1, text: 'Season shanks generously. Sear in oil until browned all over, 8 min.' },
        { order: 2, text: 'Sauté celery, carrot, and garlic until softened.' },
        { order: 3, text: 'Deglaze with red wine, scraping the fond.' },
        { order: 4, text: 'Add tomatoes and rosemary. Return shanks, cover, and braise at 160°C for 2.5–3 hours.' },
        { order: 5, text: 'Shank is done when meat pulls away from the bone. Reduce braising liquid if needed.' },
      ],
      tags: ['Lamb', 'Weekend', 'Braise', 'French'],
    },
  ]

  for (const r of recipes) {
    const { ingredients, steps, tags, ...rest } = r
    const tagRecords = await Promise.all(
      tags.map((name) => db.tag.upsert({ where: { name }, update: {}, create: { name } }))
    )
    await db.recipe.create({
      data: {
        ...rest,
        totalTime: (rest.prepTime ?? 0) + (rest.cookTime ?? 0),
        ingredients: { create: ingredients },
        steps: { create: steps },
        tags: { create: tagRecords.map((t) => ({ tagId: t.id })) },
      },
    })
  }

  console.log('Seeded 3 recipes.')
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); db.$disconnect(); process.exit(1) })
