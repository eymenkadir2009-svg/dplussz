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
 * Fetch YouTube transcript using the youtube-transcript package.
 *
 * We try MULTIPLE strategies because YouTube's bot detection is flaky:
 *
 * 1. Try with the requested language (e.g. "en")
 * 2. Try with no language filter (returns first available track — usually auto-generated)
 * 3. Try fetching the raw transcript XML directly if the package fails
 *
 * The package throws "Transcript is disabled" when the requested language
 * isn't available, even though the video may have captions in another language
 * or auto-generated captions. We catch that and try the next strategy.
 */
async function tryFetchTranscript(
  videoId: string,
  lang?: string,
): Promise<TranscriptEntry[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId, lang ? { lang } : {});
  return raw.map((r: any) => ({
    start: Number(r.offset ?? 0) / 1000,
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

  const strategies: Array<{ name: string; fn: () => Promise<TranscriptEntry[]> }> = [
    { name: "lang-en", fn: () => tryFetchTranscript(videoId, "en") },
    { name: "lang-tr", fn: () => tryFetchTranscript(videoId, "tr") },
    { name: "no-lang-filter", fn: () => tryFetchTranscript(videoId) },
  ];

  for (const strategy of strategies) {
    try {
      const entries = await strategy.fn();
      if (entries.length > 0) {
        return NextResponse.json({
          ok: true,
          sourceLanguage: lang,
          strategy: strategy.name,
          entryCount: entries.length,
          entries,
        });
      }
    } catch (e: any) {
      const msg = e?.message ?? "";
      // If it's a "too many requests" or captcha error, stop trying —
      // the next strategies will also fail.
      if (
        msg.includes("captcha") ||
        msg.includes("too many requests") ||
        msg.includes("TooManyRequest")
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "YouTube şimdilik çok fazla istek alıyor. Lütfen birkaç dakika sonra tekrar deneyin.",
            videoId,
          },
          { status: 429 },
        );
      }
      // Otherwise, try the next strategy
      continue;
    }
  }

  // All strategies failed
  return NextResponse.json(
    {
      ok: false,
      error:
        "Bu videoda erişilebilir altyazı bulunamadı. Video altyazıya sahip olsa bile YouTube bazen sunucu taraflı erişimi engeller. Lütfen başka bir video deneyin veya birkaç dakika sonra tekrar deneyin.",
      videoId,
      hint: "YouTube'un bot koruması bazen altyazı erişimini engeller. Bu geçici olabilir.",
    },
    { status: 404 },
  );
}
