# Mealio

A multi-user recipe sharing app for you and your friends. Paste a YouTube link, Instagram reel, TikTok, or any recipe website — AI extracts the ingredients and steps automatically. Built with Next.js 14 with a glass-morphism UI, Docker-deployed behind Cloudflare Tunnel.


## What it does

Mealio solves the "send me that recipe" problem. Instead of screenshotting a reel or typing out ingredients from a video description, you paste a URL and the app does the rest:

1. **Paste a link** — YouTube, Instagram, TikTok, or any recipe website
2. **AI extracts the recipe** — DeepSeek structures it into title, ingredients, steps, prep time, and tags. Vision model (Claude Haiku) handles screenshots.
3. **Review and save** — Edit anything before saving to the shared library
4. **Cook from it** — Open cook mode, plan it into your week, share with friends

### Import Sources

| Source | How it works |
|---|---|
| **YouTube** | `youtubei.js` Innertube extracts title, description, transcript. DeepSeek structures into recipe. Supplemental web extraction fills in missing steps. |
| **Instagram / TikTok** | Screenshot-based — Instagram blocked all free API paths in 2026. Upload a screenshot and vision extraction handles it. |
| **Any website** | Firecrawl fetches the page, DeepSeek structures it. Works with JSON-LD recipe schema and plain-text pages. |
| **Manual** | Fill-in form for direct entry when you have the recipe on hand. |
| **Camera / QR** | Scan barcodes to import products, or take a photo of a printed recipe. |

### Features

- **Shared recipe library** — everyone sees everything. Like a family cookbook.
- **Per-user favorites** — heart what you love, it's yours.
- **Collections** — group recipes by theme (weeknight dinners, holiday baking, meal prep).
- **Meal planning** — drag recipes onto a weekly calendar. Aggregates ingredients into a categorized shopping list.
- **Smart shopping lists** — human-readable formatting: "Chicken Breast" not "1 Chicken Breast". Herbs, spices, dairy, and staples show as name-only since you buy them as a package.
- **Cook mode** — full-screen step-by-step with timers. Designed for a phone propped up on the counter.
- **Dark / light theme** — glass-morphism UI with CSS variable tokens. Persists across sessions.
- **Share links** — public share URLs for sending recipes to friends who don't have an account.

### User Experience

The app is shared with Andrew's friends — it's a small multi-user production app, not a toy. Recipes are communal; favorites, collections, and meal plans are per-user. Auth uses HMAC-signed session cookies with scrypt-hashed passwords. No third-party auth providers — just email + password.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom glass tokens (CSS variables) |
| Database | Prisma ORM + SQLite |
| Auth | HMAC session cookies, scrypt password hashing |
| AI Import | DeepSeek (text extraction), Claude Haiku (vision via OAuth bypass) |
| Web Fetch | Firecrawl (generic), youtubei.js (YouTube) |
| Container | Docker (Node 22 Alpine) |

## Architecture

```
Browser
  │
  │  https://<your-domain>
  ▼
Cloudflare Tunnel (cloudflared systemd)
  │
  │  localhost:3015
  ▼
┌──────────────────────────────────┐
│  Docker Host                     │
│                                  │
│  mealio container (Docker)       │
│  ├── Next.js 14 app router       │
│  ├── Prisma/SQLite               │
│  ├── Tailwind + glass tokens     │
│  └── Port 3015                   │
└──────────────────────────────────┘
```

## Feature Branches

| Branch | Scope |
|---|---|
| `main` | Production |
| `feature/import-pipeline` | YouTube, Instagram, web, screenshot extraction (`src/lib/import/`) |
| `feature/recipe-management` | Library, detail view, edit, favorites, sharing |
| `feature/collections` | User collections, grouping, collection picker |
| `feature/meal-planning` | Weekly calendar, shopping list formatter |
| `feature/auth` | Login, signup, password reset, HMAC sessions |
| `feature/camera-scanner` | QR/barcode, live viewfinder, image upload |
| `feature/glass-ui` | Glass tokens, dark/light theme, Tailwind components |
