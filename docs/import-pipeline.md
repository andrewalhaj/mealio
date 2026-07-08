# Mealio Import Pipeline — Detail

## Flow
`POST /api/import {url}` (auth-gated) →
1. `platformDetect(url)` → youtube | instagram | tiktok | generic
2. `fetchFromUrl(url, platform)` in `src/lib/import/fetcher.ts`:
   - **youtube** → `fetchYouTube()` in `youtubeFetcher.ts` (youtubei.js Innertube, no API key); on throw, falls back to Firecrawl with console.error
   - others → Firecrawl `POST https://api.firecrawl.dev/v1/scrape` with `formats:['markdown']`, Bearer `FIRECRAWL_API_KEY`
3. `extractRecipe(rawText)` in `extractor.ts` — DeepSeek via OpenAI client, `response_format: json_object`, temp 0.1, input truncated to 8000 chars. Env: `DEEPSEEK_API_KEY`, `EXTRACTION_BASE_URL`, `EXTRACTION_MODEL`.
4. Hero image upgrade via `searchFoodWeb()` — Firecrawl search for food photos. Recipe-site og-images are professional dish photos; YouTube thumbnails are often the creator's face.
5. Supplemental step extraction — if video description lacks steps, re-extract from the linked recipe page.

### Screenshot import path
`POST /api/import/image` (multipart `image` field):
1. Image validation (type, size ≤8MB)
2. Vision model (Claude Haiku via Anthropic OAuth bypass) extracts recipe
3. Same hero image + supplemental step logic as URL import

### YouTube fetcher (youtubei.js v17)
```ts
const yt = await Innertube.create({ generate_session_locally: true })
const info = await yt.getInfo(videoId)
title:       info.primary_info.title.text
description: info.secondary_info.description.text
```
Transcript often 400s from datacenter IPs — description + supplemental web extraction is the working path.

## Key pitfalls
- Firecrawl fails for YouTube: descriptions are JS lazy-loaded, scrape returns page shell with no recipe text
- Zod `.optional()` rejects `null` — use `.nullish()` for nullable fields
- Vision 401 = expired OAuth token. Sync credentials from your local machine: `scp ~/.claude/.credentials.json <user>@<host>:~/.claude/.credentials.json`
