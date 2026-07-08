# Apify Instagram fetcher — verified working call (2026-06-13)

Replaces the dead Firecrawl IG path. Instagram blocked all free API paths in 2026.
Key lives in `<hostname>` `.env.docker` as `APIFY_API_KEY` (free tier).

## The actor that works
- **Actor:** `apify/instagram-scraper`, actor ID `shu8hvrXbJbY3Eb9W`
- RESIDENTIAL proxy is **mandatory** — datacenter IPs get blocked immediately

## Working call
```bash
KEY="$APIFY_API_KEY"
RUN=$(curl -s -X POST \
  "https://api.apify.com/v2/acts/shu8hvrXbJbY3Eb9W/runs?token=$KEY&waitForFinish=120" \
  -H "Content-Type: application/json" \
  -d '{"directUrls":["https://www.instagram.com/<shortcode>/"],"resultsType":"posts","resultsLimit":1,"proxy":{"useApifyProxy":true,"apifyProxyGroups":["RESIDENTIAL"]}}')
DS=$(echo "$RUN" | python3 -c 'import json,sys;print(json.load(sys.stdin)["data"]["defaultDatasetId"])')
curl -s "https://api.apify.com/v2/datasets/$DS/items?token=$KEY"
```

## Diagnosing failures
- `not_found` + `require_login:true` → private account. Screenshot import is the fallback.
- `no_items` → login-walled content
- Check run log: `curl -s "https://api.apify.com/v2/actor-runs/<RUN_ID>/log?token=$KEY" | tail -30`

## Wiring
`fetchFromUrl` in `src/lib/import/fetcher.ts`: add `if (platform === 'instagram') return await fetchInstagram(url)` BEFORE the Firecrawl fallback.
