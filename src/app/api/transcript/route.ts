import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface TranscriptEntry {
  start: number;
  dur: number;
  text: string;
}

/**
 * Fetch YouTube transcript via the youtube-transcript package.
 *
 * This package fetches the YouTube watch page, parses the caption tracks
 * from ytInitialPlayerResponse, then downloads the actual caption content
 * from YouTube's timedtext endpoint.
 *
 * Works for videos that have captions (auto-generated or manual).
 * Returns 404 if the video has no captions or captions are disabled.
 */
async function fetchTranscriptViaPackage(
  videoId: string,
  lang: string = "en",
): Promise<TranscriptEntry[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang });
  return raw.map((r: any) => ({
    start: Number(r.offset ?? 0) / 1000, // package returns ms, we want seconds
    dur: Number(r.duration ?? 0) / 1000,
    text: String(r.text ?? "").trim(),
  }));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const videoId = url.searchParams.get("videoId");
  const lang = url.searchParams.get("lang") ?? "en";

  if (!videoId) {
    return NextResponse.json(
      { ok: false, error: "Missing videoId query param" },
      { status: 400 },
    );
  }

  try {
    const entries = await fetchTranscriptViaPackage(videoId, lang);
    if (entries.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Bu videoda altyazı bulunamadı veya altyazılar devre dışı. YouTube'da altyazısı olmayan videolar için çeviri yapılamaz.",
          videoId,
        },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      sourceLanguage: lang,
      entryCount: entries.length,
      entries,
    });
  } catch (e: any) {
    const msg = e?.message ?? "Unknown transcript fetch error";
    // Provide a user-friendly error message
    let friendly = msg;
    if (msg.includes("disabled")) {
      friendly =
        "Bu videoda altyazı devre dışı bırakılmış. Lütfen altyazısı olan bir video deneyin.";
    } else if (msg.includes("captcha") || msg.includes("too many requests")) {
      friendly =
        "YouTube şimdilik çok fazla istek alıyor. Lütfen birkaç dakika sonra tekrar deneyin.";
    } else if (msg.includes("Could not find")) {
      friendly = "Bu videoda altyazı bulunamadı.";
    }
    return NextResponse.json(
      { ok: false, error: friendly, rawError: msg, videoId },
      { status: 500 },
    );
  }
}
