import type { FetchResult } from './types'

const APIFY_ACTOR_ID = 'shu8hvrXbJbY3Eb9W' // public actor slug: apify/instagram-scraper — gitleaks:allow

export async function fetchInstagram(url: string): Promise<FetchResult> {
  const apiKey = process.env.APIFY_API_KEY
  if (!apiKey) throw new Error('APIFY_API_KEY not set — cannot import Instagram posts')

  // Extract @creator handle for attribution
  let creator = ''
  const match = url.match(/@([a-zA-Z0-9_.]+)/)
  if (match) creator = `@${match[1]}`

  // Start Apify run and wait for finish (120s timeout)
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${apiKey}&waitForFinish=120`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directUrls: [url],
        resultsType: 'posts',
        resultsLimit: 1,
        proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
      }),
    },
  )

  if (!runRes.ok) {
    const err = await runRes.text()
    throw new Error(`Apify run failed (${runRes.status}): ${err.slice(0, 200)}`)
  }

  const runData = (await runRes.json()) as {
    data?: { status: string; defaultDatasetId: string }
  }

  const run = runData.data
  if (!run) throw new Error('Apify returned no run data')
  if (run.status !== 'SUCCEEDED') {
    throw new Error(`Apify run ${run.status} — Instagram may be temporarily unavailable`)
  }

  // Fetch dataset items
  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${apiKey}`,
  )
  if (!itemsRes.ok) throw new Error(`Apify dataset fetch failed (${itemsRes.status})`)

  const items = (await itemsRes.json()) as Array<{
    caption?: string
    ownerUsername?: string
    displayUrl?: string
    thumbnailUrl?: string
    error?: string
    errorDescription?: string
  }>

  if (!items.length) throw new Error('Apify returned empty dataset for this Instagram post')

  const item = items[0]

  // Handle private/not-found posts
  if (item.error === 'not_found') {
    throw new Error(
      'This Instagram post could not be retrieved — it may be from a private account or require login. Try screenshotting it and using the 📎 upload button instead.',
    )
  }

  if (item.error) {
    throw new Error(`Instagram import failed: ${item.errorDescription ?? item.error}`)
  }

  const caption = item.caption ?? ''
  if (!caption.trim()) {
    throw new Error(
      'This Instagram post has no caption text. If it has a recipe, try screenshotting it and using the 📎 upload button instead.',
    )
  }

  const owner = item.ownerUsername ?? creator.replace('@', '')
  const sourceAttr = owner
    ? `Imported from @${owner} on Instagram`
    : 'Imported from Instagram'

  return {
    platform: 'instagram',
    rawText: caption,
    thumbnailUrl: item.displayUrl ?? item.thumbnailUrl,
    sourceAttr,
  }
}
