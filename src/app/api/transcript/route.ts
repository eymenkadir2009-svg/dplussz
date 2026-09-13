import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface TranscriptEntry {
  start: number;
  dur: number;
  text: string;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
  name?: { simpleText?: string };
  vssId?: string;
}

/**
 * Fetch YouTube transcript using a downsub-style approach:
 *
 * 1. Fetch the YouTube watch page HTML
 * 2. Find "captionTracks":[ pattern in the HTML
 * 3. Parse the caption tracks JSON array
 * 4. Pick the best track (English first, then any)
 * 5. Fetch the actual caption content from the track's baseUrl
 * 6. Parse the XML/srv3 format into TranscriptEntry[]
 *
 * Also falls back to the youtube-transcript npm package if the
 * downsub-style approach fails (the package uses the InnerTube API
 * with an Android client, which sometimes bypasses bot detection).
 */

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
];

async function fetchWatchPage(videoId: string): Promise<string | null> {
  const url = `https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US`;

  for (const ua of USER_AGENTS) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          Cookie:
            "PREF=f4=4000000&f6=9&hl=en&gl=US; CONSENT=YES+cb; SOCS=CAISNQgDEitib3FfaWRlbnRpdHlfZm9yZXJpZ25lcjpCgEIBDGIAKA",
        },
        cache: "no-store",
        redirect: "follow",
      } as RequestInit);

      if (!res.ok) continue;

      const html = await res.text();

      if (
        html.includes("g-recaptcha") ||
        html.includes("Sign in to confirm") ||
        html.length < 10000
      ) {
        continue;
      }

      if (html.includes("captionTracks")) {
        return html;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractCaptionTracksFromHtml(html: string): CaptionTrack[] {
  const pattern = '"captionTracks":[';
  const idx = html.indexOf(pattern);
  if (idx < 0) return [];

  const start = idx + pattern.length - 1;
  let end = start;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  const tracksJson = html.slice(start, end);
  try {
    const tracks = JSON.parse(tracksJson);
    if (Array.isArray(tracks)) {
      return tracks;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function pickBestTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;

  const enManual = tracks.find(
    (t) => t.languageCode?.startsWith("en") && t.kind !== "asr",
  );
  if (enManual) return enManual;

  const enAsr = tracks.find(
    (t) => t.languageCode?.startsWith("en") && t.kind === "asr",
  );
  if (enAsr) return enAsr;

  const en = tracks.find((t) => t.languageCode?.startsWith("en"));
  if (en) return en;

  const nonAsr = tracks.find((t) => t.kind !== "asr");
  if (nonAsr) return nonAsr;

  return tracks[0];
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(parseInt(dec, 10)),
    );
}

function parseSrv3Xml(xml: string): TranscriptEntry[] {
  const results: TranscriptEntry[] = [];
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    const startMs = parseInt(match[1], 10);
    const durMs = parseInt(match[2], 10);
    const inner = match[3];

    let text = "";
    const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
    let sMatch;
    while ((sMatch = sRegex.exec(inner)) !== null) {
      text += sMatch[1];
    }

    if (!text) {
      text = inner.replace(/<[^>]+>/g, "");
    }

    text = decodeEntities(text).trim();
    if (text) {
      results.push({
        start: startMs / 1000,
        dur: durMs / 1000,
        text,
      });
    }
  }

  if (results.length > 0) return results;
  return parseClassicXml(xml);
}

function parseClassicXml(xml: string): TranscriptEntry[] {
  const results: TranscriptEntry[] = [];
  const regex = /<text\s+start="([^"]*)"\s+dur="([^"]*)"[^>]*>([^<]*)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const text = decodeEntities(match[3]).trim();
    if (text) {
      results.push({
        start: parseFloat(match[1]),
        dur: parseFloat(match[2]),
        text,
      });
    }
  }
  return results;
}

async function fetchCaptionContent(
  track: CaptionTrack,
): Promise<TranscriptEntry[]> {
  const formats = ["&fmt=srv3", "&fmt=json3", ""];

  for (const fmt of formats) {
    try {
      const url = track.baseUrl + fmt;
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENTS[0],
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      });

      if (!res.ok) continue;

      const text = await res.text();
      if (!text || text.length === 0) continue;

      const entries = parseSrv3Xml(text);
      if (entries.length > 0) {
        return entries;
      }

      try {
        const data = JSON.parse(text);
        const events: any[] = data?.events ?? [];
        const jsonEntries: TranscriptEntry[] = [];
        for (const ev of events) {
          const segs = ev?.segs;
          if (!Array.isArray(segs) || segs.length === 0) continue;
          const t = segs
            .map((s: any) => (typeof s?.utf8 === "string" ? s.utf8 : ""))
            .join("")
            .replace(/\s+/g, " ")
            .trim();
          if (!t) continue;
          jsonEntries.push({
            start: Number(ev.tStartMs ?? 0) / 1000,
            dur: Number(ev.dDurationMs ?? 0) / 1000,
            text: t,
          });
        }
        if (jsonEntries.length > 0) {
          return jsonEntries;
        }
      } catch {
        /* not JSON */
      }
    } catch {
      continue;
    }
  }

  return [];
}

/**
 * Fallback: use the youtube-transcript package.
 * This uses the InnerTube API with an Android client context, which
 * sometimes bypasses YouTube's bot detection.
 */
async function fetchViaPackage(
  videoId: string,
): Promise<TranscriptEntry[]> {
  const strategies = [
    () => YoutubeTranscript.fetchTranscript(videoId, { lang: "en" }),
    () => YoutubeTranscript.fetchTranscript(videoId, { lang: "tr" }),
    () => YoutubeTranscript.fetchTranscript(videoId),
  ];

  for (const strategy of strategies) {
    try {
      const raw = await strategy();
      const entries = raw.map((r: any) => ({
        start: Number(r.offset ?? 0) / 1000,
        dur: Number(r.duration ?? 0) / 1000,
        text: String(r.text ?? "").trim(),
      }));
      if (entries.length > 0) return entries;
    } catch {
      continue;
    }
  }

  return [];
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const videoId = url.searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { ok: false, error: "Missing videoId query param" },
      { status: 400 },
    );
  }

  try {
    // Strategy 1: downsub-style — fetch watch page, extract captionTracks,
    // fetch caption content directly.
    try {
      const html = await fetchWatchPage(videoId);
      if (html) {
        const tracks = extractCaptionTracksFromHtml(html);
        if (tracks.length > 0) {
          const track = pickBestTrack(tracks);
          if (track && track.baseUrl) {
            const entries = await fetchCaptionContent(track);
            if (entries.length > 0) {
              return NextResponse.json({
                ok: true,
                sourceLanguage: track.languageCode,
                trackKind: track.kind ?? "manual",
                strategy: "downsub-watchpage",
                entryCount: entries.length,
                entries,
              });
            }
          }
        }
      }
    } catch {
      /* fall through to package strategy */
    }

    // Strategy 2: youtube-transcript package (InnerTube API)
    try {
      const entries = await fetchViaPackage(videoId);
      if (entries.length > 0) {
        return NextResponse.json({
          ok: true,
          sourceLanguage: "en",
          strategy: "innertube-package",
          entryCount: entries.length,
          entries,
        });
      }
    } catch {
      /* fall through to error */
    }

    // All strategies failed
    return NextResponse.json(
      {
        ok: false,
        error:
          "Bu videoda altyazı bulunamadı veya erişilemedi. YouTube bot koruması devreye girmiş olabilir. Lütfen birkaç dakika sonra tekrar deneyin veya başka bir video deneyin.",
        videoId,
        hint: "YouTube'un bot koruması bazen altyazı erişimini geçici olarak engeller. Vercel'de farklı bir IP'den istek yapıldığında bu sorun genellikle çözülür.",
      },
      { status: 404 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message ?? "Bilinmeyen hata",
        videoId,
      },
      { status: 500 },
    );
  }
}

