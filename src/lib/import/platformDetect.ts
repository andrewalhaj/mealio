export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'generic'

export function detectPlatform(url: string): Platform {
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube'
    if (h.includes('instagram.com')) return 'instagram'
    if (h.includes('tiktok.com')) return 'tiktok'
  } catch { /* invalid url */ }
  return 'generic'
}
