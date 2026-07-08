import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { detectPlatform } from '@/lib/import/platformDetect'
import { fetchFromUrl } from '@/lib/import/fetcher'
import { extractRecipe } from '@/lib/import/extractor'
import { searchFoodWeb } from '@/lib/import/foodImageSearch'
import { getSessionUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 180

export async function POST(req: NextRequest) {
  const { url } = await req.json() as { url: string }

  if (!url?.trim()) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  // Create import history record
  const userId = await getSessionUserId()
  const record = await db.importHistory.create({
    data: { url, status: 'fetching', userId },
  })

  try {
    // 1. Detect platform
    const platform = detectPlatform(url)
    await db.importHistory.update({ where: { id: record.id }, data: { platform, status: 'fetching' } })

    // 2. Fetch content
    const fetched = await fetchFromUrl(url, platform)
    await db.importHistory.update({ where: { id: record.id }, data: { status: 'reading' } })

    // 3. Extract recipe via LLM
    await db.importHistory.update({ where: { id: record.id }, data: { status: 'structuring' } })
    const extracted = await extractRecipe(fetched.rawText)

    // 4. Merge fetch metadata into extracted
    // For social platforms (YouTube, Instagram, TikTok), prefer a real food photo
    // over video thumbnails / channel avatars, which usually show the creator, not the dish.
    // For generic platforms (recipe websites), their og-image is already the dish — skip search.
    if (extracted.title && platform !== 'generic') {
      const webResult = await searchFoodWeb(extracted.title, fetched.creator)
      if (webResult.imageUrl) extracted.heroImage = webResult.imageUrl

      // NEW: supplemental extraction when steps or ingredients are missing
      if (((extracted.steps?.length ?? 0) === 0 || (extracted.ingredients?.length ?? 0) === 0) && webResult.pageMarkdown) {
        try {
          const supplemental = await extractRecipe(webResult.pageMarkdown)
          // Merge each missing field INDEPENDENTLY — a paywalled/partial page may
          // expose ingredients but not steps (or vice versa); take what we can get.
          const mergedSteps = (extracted.steps?.length ?? 0) === 0 && (supplemental.steps?.length ?? 0) > 0
          const mergedIngredients = (extracted.ingredients?.length ?? 0) === 0 && (supplemental.ingredients?.length ?? 0) > 0
          if (mergedSteps) extracted.steps = supplemental.steps
          if (mergedIngredients) extracted.ingredients = supplemental.ingredients
          if (mergedSteps || mergedIngredients) {
            if (!extracted.prepTime && supplemental.prepTime) extracted.prepTime = supplemental.prepTime
            if (!extracted.cookTime && supplemental.cookTime) extracted.cookTime = supplemental.cookTime
            if (!extracted.servings && supplemental.servings) extracted.servings = supplemental.servings
            // annotate provenance so the user knows what came from the web, not the video:
            const what = mergedSteps && mergedIngredients ? 'Ingredients and steps'
              : mergedSteps ? 'Steps' : 'Ingredients'
            if (webResult.matchedCreator && webResult.pageUrl) {
              extracted.notes = `${what} sourced from the creator's site: ${webResult.pageUrl}` +
                (extracted.notes ? `\n${extracted.notes}` : '')
            } else if (webResult.pageUrl) {
              extracted.notes = `${what} sourced from ${webResult.pageUrl} — NOTE: this is a different creator's version of this dish and may not match the video exactly.` +
                (extracted.notes ? `\n${extracted.notes}` : '')
            }
          }
        } catch (e) { console.error('[import] supplemental extraction failed:', e) }
      }

      // LAST RESORT: if steps are STILL missing (e.g. creator's page is paywalled),
      // try a generic web search (no creator) and take steps from any version of the
      // dish — clearly labeled as a different creator's method.
      if ((extracted.steps?.length ?? 0) === 0 && fetched.creator) {
        try {
          const genericResult = await searchFoodWeb(extracted.title)
          if (genericResult.pageMarkdown && genericResult.pageUrl !== webResult.pageUrl) {
            const generic = await extractRecipe(genericResult.pageMarkdown)
            if ((generic.steps?.length ?? 0) > 0) {
              extracted.steps = generic.steps
              extracted.notes = `Steps sourced from ${genericResult.pageUrl} — NOTE: this is a different creator's version of this dish; the method may not match the video exactly.` +
                (extracted.notes ? `\n${extracted.notes}` : '')
            }
          }
        } catch (e) { console.error('[import] generic step fallback failed:', e) }
      }
    }
    // Fallback: use fetched thumbnail if no heroImage yet
    if (fetched.thumbnailUrl && !extracted.heroImage) {
      extracted.heroImage = fetched.thumbnailUrl
    }
    if (fetched.sourceAttr && !extracted.sourceAttr) {
      extracted.sourceAttr = fetched.sourceAttr
    }

    // 5. Determine status: partial if extraction found nothing useful
    // (runs AFTER supplemental merge, so supplemented steps count)
    const hasContent = extracted.title ||
      (extracted.ingredients && extracted.ingredients.length > 0) ||
      (extracted.steps && extracted.steps.length > 0)

    if (hasContent) {
      await db.importHistory.update({ where: { id: record.id }, data: { status: 'done' } })
    } else {
      await db.importHistory.update({
        where: { id: record.id },
        data: { status: 'partial', errorMsg: 'No recipe content found in source' },
      })
    }

    return NextResponse.json({
      importId: record.id,
      platform,
      sourceUrl: url,
      sourceAttr: extracted.sourceAttr ?? fetched.sourceAttr,
      extracted,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await db.importHistory.update({
      where: { id: record.id },
      data: { status: 'failed', errorMsg: msg },
    })
    return NextResponse.json({ error: msg, importId: record.id }, { status: 422 })
  }
}
