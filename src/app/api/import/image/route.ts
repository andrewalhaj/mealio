import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { extractRecipeFromImage } from '@/lib/import/visionExtractor'
import { searchFoodWeb } from '@/lib/import/foodImageSearch'
import { getSessionUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const VISION_NOT_CONFIGURED_MSG =
  'Screenshot import requires a vision model — set VISION_API_KEY, VISION_BASE_URL and VISION_MODEL in .env.docker'

export async function POST(req: NextRequest) {
  // 1. Parse multipart form
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('image') as File | null

  // 2. Validate file presence
  if (!file) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
  }

  // 3. Validate MIME type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: `File must be an image, received: ${file.type || 'unknown'}` },
      { status: 400 },
    )
  }

  // 4. Validate file size (8MB max)
  const MAX_SIZE = 8 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 8MB.` },
      { status: 400 },
    )
  }

  // 5. Check vision API key BEFORE creating history record
  const hasVisionConfig = process.env.VISION_API_KEY || process.env.ANTHROPIC_BYPASS_CREDENTIALS
  if (!hasVisionConfig) {
    return NextResponse.json({ error: VISION_NOT_CONFIGURED_MSG }, { status: 503 })
  }

  // 6. Create import history record
  const userId = await getSessionUserId()
  const record = await db.importHistory.create({
    data: {
      url: `screenshot:${file.name}`,
      platform: 'screenshot',
      status: 'structuring',
      userId,
    },
  })

  try {
    // 7. Read file into base64
    const buf = Buffer.from(await file.arrayBuffer())
    const base64 = buf.toString('base64')

    // 8. Extract recipe via vision LLM
    const extracted = await extractRecipeFromImage(base64, file.type)

    // 9. Search for food image if title present (same logic as URL route)
    if (extracted.title) {
      const webResult = await searchFoodWeb(extracted.title)
      if (webResult.imageUrl) extracted.heroImage = webResult.imageUrl

      // Supplemental extraction when steps are missing
      if ((extracted.steps?.length ?? 0) === 0 && webResult.pageMarkdown) {
        try {
          const { extractRecipe } = await import('@/lib/import/extractor')
          const supplemental = await extractRecipe(webResult.pageMarkdown)
          if ((supplemental.steps?.length ?? 0) > 0) {
            extracted.steps = supplemental.steps
            if ((extracted.ingredients?.length ?? 0) === 0 && (supplemental.ingredients?.length ?? 0) > 0) {
              extracted.ingredients = supplemental.ingredients
            }
            if (!extracted.prepTime && supplemental.prepTime) extracted.prepTime = supplemental.prepTime
            if (!extracted.cookTime && supplemental.cookTime) extracted.cookTime = supplemental.cookTime
            if (!extracted.servings && supplemental.servings) extracted.servings = supplemental.servings
            extracted.notes = `Steps sourced from ${webResult.pageUrl} (screenshot had no instructions).` +
              (extracted.notes ? `\n${extracted.notes}` : '')
          }
        } catch (e) {
          console.error('[import/image] supplemental extraction failed:', e)
        }
      }
    }

    // 10. Determine status
    const hasContent =
      extracted.title ||
      (extracted.ingredients && extracted.ingredients.length > 0) ||
      (extracted.steps && extracted.steps.length > 0)

    if (hasContent) {
      await db.importHistory.update({ where: { id: record.id }, data: { status: 'done' } })
    } else {
      await db.importHistory.update({
        where: { id: record.id },
        data: { status: 'partial', errorMsg: 'No recipe content found in screenshot' },
      })
    }

    return NextResponse.json({
      importId: record.id,
      platform: 'screenshot',
      sourceUrl: '',
      sourceAttr: 'Imported from screenshot',
      extracted,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)

    await db.importHistory.update({
      where: { id: record.id },
      data: { status: 'failed', errorMsg: msg },
    })

    if (msg === 'VISION_NOT_CONFIGURED') {
      return NextResponse.json({ error: VISION_NOT_CONFIGURED_MSG, importId: record.id }, { status: 503 })
    }

    return NextResponse.json({ error: msg, importId: record.id }, { status: 500 })
  }
}
