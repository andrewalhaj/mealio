import type { FetchResult } from './types'
import type { Platform } from './platformDetect'
import { fetchYouTube } from './youtubeFetcher'
import { fetchInstagram } from './instagramFetcher'

const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1'

async function firecrawlScrape(url: string): Promise<{ markdown: string; ogImage?: string }> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not set')

  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      includeTags: ['p', 'li', 'h1', 'h2', 'h3', 'img', 'meta'],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Firecrawl error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json() as {
    success: boolean
    data?: {
      markdown?: string
      metadata?: { ogImage?: string; description?: string }
    }
  }

  if (!data.success || !data.data?.markdown) {
    throw new Error('Firecrawl returned no content')
  }

  return {
    markdown: data.data.markdown,
    ogImage: data.data.metadata?.ogImage,
  }
}

export async function fetchFromUrl(url: string, platform: Platform): Promise<FetchResult> {
  // YouTube: use dedicated Innertube client for title + description + transcript
  if (platform === 'youtube') {
    try {
      return await fetchYouTube(url)
    } catch (e) {
      console.error('[import] YouTube fetcher failed, falling back to Firecrawl:', e)
    }
  }

  // Instagram: use Apify scraper (Firecrawl dropped IG support)
  if (platform === 'instagram') {
    return await fetchInstagram(url)
  }

  // Fallback: all platforms (including YouTube fallback) go through Firecrawl
  const platformLabels: Record<Platform, string> = {
    youtube:   'YouTube',
    instagram: 'Instagram',
    tiktok:    'TikTok',
    generic:   'web',
  }

  const { markdown, ogImage } = await firecrawlScrape(url)

  // Try to extract @creator handle for attribution
  let creator = ''
  if (platform === 'tiktok') {
    const match = url.match(/\/@?([a-zA-Z0-9_.]+)/)
    if (match) creator = `@${match[1]}`
  }

  // Generic sites: credit the actual domain (e.g. "Imported from hellofresh.com")
  let genericLabel = platformLabels[platform]
  if (platform === 'generic') {
    try {
      genericLabel = new URL(url).hostname.replace(/^www\./, '')
    } catch { /* keep 'web' */ }
  }

  return {
    platform,
    rawText: markdown,
    thumbnailUrl: ogImage,
    sourceAttr: creator
      ? `Imported from ${creator} on ${platformLabels[platform]}`
      : `Imported from ${genericLabel}`,
  }
}
