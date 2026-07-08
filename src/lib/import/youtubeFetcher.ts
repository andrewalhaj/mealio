import { Innertube } from 'youtubei.js'
import type { FetchResult } from './types'

export async function fetchYouTube(url: string): Promise<FetchResult> {
  // Extract video ID from watch?v=, youtu.be/, shorts/, embed/ URL forms
  const idMatch = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/)
  if (!idMatch) throw new Error('Could not parse YouTube video ID')
  const videoId = idMatch[1]

  const yt = await Innertube.create({ generate_session_locally: true })
  const info = await yt.getInfo(videoId)

  // youtubei.js v17+ API: title in primary_info, description/author in secondary_info
  const title = info.primary_info?.title?.text ?? ''
  const description = info.secondary_info?.description?.text ?? ''
  const author = info.secondary_info?.owner?.author?.name ?? ''
  const thumbnails = info.secondary_info?.owner?.author?.thumbnails ?? []
  const thumbnail = thumbnails.length > 0
    ? thumbnails[thumbnails.length - 1]?.url
    : undefined

  // Try transcript (may fail with 400 in some regions — that's ok)
  let transcript = ''
  try {
    const t = await info.getTranscript()
    const segs = t?.transcript?.content?.body?.initial_segments
    if (segs) {
      transcript = segs
        .map((s: { snippet?: { text?: string } }) => s.snippet?.text ?? '')
        .join(' ')
    }
  } catch {
    // No transcript available — proceed with description only
  }

  const parts = [`VIDEO TITLE: ${title}`]
  if (description) parts.push(`\nDESCRIPTION:\n${description}`)
  if (transcript) parts.push(`\nTRANSCRIPT:\n${transcript}`)

  const rawText = parts.join('\n\n').trim()

  return {
    platform: 'youtube',
    rawText,
    thumbnailUrl: thumbnail,
    sourceAttr: author
      ? `Imported from ${author} on YouTube`
      : 'Imported from YouTube',
    creator: author || undefined,
  }
}
