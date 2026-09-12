# D+SZ — Starz-style Streaming Site

A black-themed streaming UI built with **Next.js 16 + TypeScript + Tailwind CSS 4**.

## Features
- Pure-black home page with D+SZ logo navbar and featured-movie hero
- Six horizontal movie-card sliders, each with hover-reveal left/right arrows
  that auto-disable at scroll boundaries
- Working search overlay (full-screen, filters the catalog by title, genre,
  year, or description)
- Working notification bell (dropdown with unread count, mark-all-read,
  dismiss, click-through to the relevant title)
- Clicking any card opens `/video?id=<movie>` — lists every chapter of that
  title's playlist (thumbnail, duration, season/episode, description)
- Clicking any chapter opens `/watch?id=<movie>&ep=<episode>` — a YouTube
  IFrame with **`controls=0`** wearing a custom **Netflix-style (non-neon)**
  control overlay:
  - Optimistic play/pause toggle (works even when YouTube state events lag)
  - Auto-hide controls after 3.5s while playing; reappear on mouse move
  - Click anywhere on the video to toggle play/pause (works even when
    controls are hidden)
  - Big center play/pause, progress bar with buffered track + scrub + hover
  - Skip ±10s, previous/next chapter, volume slider, time display
  - Fullscreen, settings buttons
  - Language button with Turkish flag icon — fetches transcript via
    /api/transcript and translates to Turkish via /api/translate (LLM7,
    free OpenAI-compatible API, no key required)
  - Subtitle overlay that shows the active Turkish entry at current time
  - Keyboard shortcuts: Space/k, ←/→, ↑/↓, f, m
  - "Up Next" list with Now Playing / Up Next labels

## Routes
| Route | Purpose |
|---|---|
| `/` | Home with hero + 6 sliders |
| `/video?id=<movie>` | Lists all chapters of a title |
| `/watch?id=<movie>&ep=<episode>` | Custom player overlay on YouTube |
| `/api/transcript?videoId=<id>` | Fetches YouTube caption tracks |
| POST \`/api/translate\` | Translates entries to Turkish via LLM7 (free, no API key) |

## Environment Variables

| Name | Required | Purpose |
|---|---|---|
| \`YOUTUBE_DATA_API_KEY\` | **Yes** (for video pages) | YouTube Data API v3 key — used by \`/api/playlist\` to fetch real playlist videos. Without it, episodes won't load. Get a key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (enable "YouTube Data API v3" and create an API key). |
| \`LLM7_API_KEY\` | No | Turkish subtitle feature uses [LLM7](https://api.llm7.io) — a free OpenAI-compatible API that does NOT require an API key. Just leave this unset and it works with \`api_key="unused"\`. Set this only if you want to use a paid plan or different backend. |
| \`LLM7_MODEL\` | No | Model name for translation (default: \`default\`). |
| \`LLM7_BASE_URL\` | No | OpenAI-compatible base URL (default: \`https://api.llm7.io/v1\`). |

To set on Vercel: Project Settings → Environment Variables → add the key(s) → Redeploy.

## Local development
```bash
npm install        # or: bun install
npm run dev        # or: bun run dev
```
Open `http://localhost:3000`.

## Deploy to Vercel
1. Push this folder to a GitHub repo (or import directly on Vercel).
2. On Vercel → **New Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Build command: `next build` (default).
5. Output: leave blank (App Router default).
6. (Optional) Add `YOUTUBE_DATA_API_KEY` env var.
7. Deploy.

## Customising
- **Movies / playlists / episodes**: edit `src/lib/data.ts`
  - Each movie has its own playlist with episodes
  - Each episode has a `youtubeId` — replace with your real YouTube video IDs
- **Logo**: change `SITE.logoUrl` in `src/lib/constants.ts`
- **Player behaviour**: edit `src/components/player-controls.tsx`
- **YouTube hook**: edit `src/hooks/use-youtube-player.ts`
- **Search**: edit `src/components/search-overlay.tsx`
- **Notifications**: edit `src/components/notification-bell.tsx` (the
  sample feed lives in `INITIAL_NOTIFICATIONS`)

## Tech
- Next.js 16 (App Router, standalone output)
- TypeScript 5
- Tailwind CSS 4 + shadcn/ui (New York)
- Lucide icons
- YouTube IFrame API (loaded client-side)
- LLM7 (free OpenAI-compatible API for Turkish translation, no API key required)
