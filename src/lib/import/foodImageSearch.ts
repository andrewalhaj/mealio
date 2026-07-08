const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1'

export interface FoodSearchResult {
  imageUrl: string | null
  pageMarkdown: string | null
  pageUrl: string | null
  /** Whether the page URL matches the creator's own domain. */
  matchedCreator: boolean
}

/**
 * Normalize a creator name for domain matching.
 * "Natashas Kitchen" → "natashaskitchen"
 */
function normalizeCreator(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`"']/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Check if a URL domain loosely matches a creator name.
 * E.g. "Natashas Kitchen" matches natashaskitchen.com.
 */
function domainMatchesCreator(url: string, creator: string): boolean {
  try {
    const hostname = new URL(url).hostname
      .replace(/^www\./, '')
      .toLowerCase()
    const normHost = hostname.replace(/[^a-z0-9]/g, '')
    const normCreator = normalizeCreator(creator)

    // Direct match: natashaskitchen.com ↔ natashaskitchen
    if (normHost === normCreator) return true
    // Creator name contains the domain's main token
    if (normCreator.includes(normHost)) return true
    // Domain contains the normalized creator name
    if (normHost.includes(normCreator)) return true

    return false
  } catch {
    return false
  }
}

interface FirecrawlSearchItem {
  url?: string
  markdown?: string
  metadata?: Record<string, unknown>
}

/**
 * Run a single Firecrawl search and extract results.
 */
async function runSearch(query: string, apiKey: string): Promise<FirecrawlSearchItem[]> {
  const res = await fetch(`${FIRECRAWL_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      query,
      limit: 3,
      scrapeOptions: { formats: ['markdown'], onlyMainContent: true },
    }),
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) return []
  const data = await res.json() as {
    success: boolean
    data?: FirecrawlSearchItem[]
  }
  return data?.data ?? []
}

/**
 * Extract imageUrl, pageMarkdown, pageUrl from search results.
 * Returns nulls for anything not found.
 */
function extractFromResults(
  items: FirecrawlSearchItem[],
): { imageUrl: string | null; pageMarkdown: string | null; pageUrl: string | null } {
  let imageUrl: string | null = null
  let pageMarkdown: string | null = null
  let pageUrl: string | null = null

  for (const item of items) {
    const md = item.metadata ?? {}
    const img = (md.ogImage ?? md['og:image']) as string | undefined
    if (!imageUrl && img && /^https?:\/\//.test(img)) {
      imageUrl = img
    }
    if (!pageMarkdown && item.markdown && typeof item.markdown === 'string' && item.markdown.length > 500) {
      pageMarkdown = item.markdown
      pageUrl = item.url ?? null
    }
    if (imageUrl && pageMarkdown) break
  }

  return { imageUrl, pageMarkdown, pageUrl }
}

/**
 * Search the web for a recipe page and its image.
 * When a creator is provided, searches "<creator> <title> recipe" first and prefers
 * results from the creator's own site.
 * Never throws.
 */
export async function searchFoodWeb(
  recipeTitle: string,
  creator?: string,
): Promise<FoodSearchResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey || !recipeTitle?.trim()) {
    return { imageUrl: null, pageMarkdown: null, pageUrl: null, matchedCreator: false }
  }

  try {
    let matchedCreator = false
    let bestImage: string | null = null
    let bestMarkdown: string | null = null
    let bestUrl: string | null = null

    // Phase 1: Creator-aware search
    if (creator) {
      const creatorQuery = `${creator} ${recipeTitle} recipe`
      const creatorResults = await runSearch(creatorQuery, apiKey)

      // Prefer a result from the creator's own domain
      for (const item of creatorResults) {
        if (
          item.url &&
          item.markdown &&
          item.markdown.length > 500 &&
          domainMatchesCreator(item.url, creator)
        ) {
          bestMarkdown = item.markdown
          bestUrl = item.url
          matchedCreator = true

          // Also grab the image from the matched result
          const md = item.metadata ?? {}
          const img = (md.ogImage ?? md['og:image']) as string | undefined
          if (img && /^https?:\/\//.test(img)) {
            bestImage = img
          }
          break
        }
      }

      // If no domain match, take the first result with sufficient markdown
      if (!bestMarkdown) {
        for (const item of creatorResults) {
          if (item.markdown && item.markdown.length > 500) {
            bestMarkdown = item.markdown
            bestUrl = item.url ?? null

            const md = item.metadata ?? {}
            const img = (md.ogImage ?? md['og:image']) as string | undefined
            if (img && /^https?:\/\//.test(img)) {
              bestImage = img
            }
            break
          }
        }
      }

      // Collect any image from creator results not yet captured
      if (!bestImage) {
        for (const item of creatorResults) {
          const md = item.metadata ?? {}
          const img = (md.ogImage ?? md['og:image']) as string | undefined
          if (img && /^https?:\/\//.test(img)) {
            bestImage = img
            break
          }
        }
      }
    }

    // Phase 2: Fallback to generic title search if no usable result yet
    if (!bestMarkdown || !bestImage) {
      const genericResults = await runSearch(`${recipeTitle} recipe`, apiKey)

      if (!bestMarkdown) {
        for (const item of genericResults) {
          if (item.markdown && item.markdown.length > 500) {
            bestMarkdown = item.markdown
            bestUrl = item.url ?? null
            // matchedCreator stays false — this is a generic result
            break
          }
        }
      }

      if (!bestImage) {
        for (const item of genericResults) {
          const md = item.metadata ?? {}
          const img = (md.ogImage ?? md['og:image']) as string | undefined
          if (img && /^https?:\/\//.test(img)) {
            bestImage = img
            break
          }
        }
      }
    }

    return {
      imageUrl: bestImage,
      pageMarkdown: bestMarkdown,
      pageUrl: bestUrl,
      matchedCreator,
    }
  } catch {
    return { imageUrl: null, pageMarkdown: null, pageUrl: null, matchedCreator: false }
  }
}

/** Thin wrapper for backward compatibility — returns only the image URL. Never throws. */
export async function findFoodImage(recipeTitle: string): Promise<string | null> {
  const result = await searchFoodWeb(recipeTitle)
  return result.imageUrl
}
