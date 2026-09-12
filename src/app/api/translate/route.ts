import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Entry {
  start: number;
  dur: number;
  text: string;
}

interface TranslateBody {
  entries: Entry[];
  target?: string; // e.g. "tr"
  source?: string; // e.g. "en"
}

const MAX_BATCH = 40; // sentences per LLM call

const LLM7_BASE_URL = "https://api.llm7.io/v1";
const LLM7_API_KEY = process.env.LLM7_API_KEY ?? "unused";
const LLM7_MODEL = process.env.LLM7_MODEL ?? "default";

/**
 * Translate an array of subtitle entries into the target language
 * using LLM7 (OpenAI-compatible, no API key required).
 *
 * We send N source texts at once and ask the model to return a JSON array
 * of N translated strings in the SAME ORDER. This keeps the response
 * structured and alignable with the original timestamps.
 *
 * LLM7 is free and OpenAI-compatible: https://api.llm7.io/v1
 * The API key is "unused" — LLM7 accepts any value.
 * If LLM7_API_KEY env var is set, we use that instead (for paid plans).
 */
async function translateBatch(
  texts: string[],
  source: string,
  target: string,
): Promise<string[]> {
  const sourceLangName = source === "en" ? "English" : source.toUpperCase();
  const targetLangName = target === "tr" ? "Turkish" : target.toUpperCase();

  const userPrompt = `You are a professional subtitle translator. Translate the following ${sourceLangName} subtitles into natural, fluent ${targetLangName}.

Rules:
- Preserve meaning and tone. Do NOT translate literally if a natural phrasing exists.
- Keep each translated subtitle on a single line.
- Do NOT add quotes, prefixes, or numbering.
- Output ONLY a JSON array of strings, in the SAME ORDER as the input.
- Each array item must correspond to the input subtitle at the same index.

Input subtitles (JSON array):
${JSON.stringify(texts, null, 0)}`;

  // Use the OpenAI-compatible fetch API directly (no SDK dependency).
  const res = await fetch(`${LLM7_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM7_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM7_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a subtitle translation API. You receive a JSON array of ${sourceLangName} subtitle strings and output a JSON array of ${targetLangName} translations, in the same order, same length. Output only the JSON array, no commentary.`,
        },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      temperature: 0.3,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    let errMsg = `LLM7 returned ${res.status}`;
    try {
      const errBody = await res.json();
      if (errBody?.error?.message) errMsg = errBody.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(`LLM7 translation failed: ${errMsg}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";

  // The model may wrap output in ```json fences; strip them.
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let arr: any;
  try {
    arr = JSON.parse(cleaned);
  } catch (e) {
    // Last-ditch: try to find a JSON array in the response.
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error("LLM7 response was not valid JSON");
    }
    arr = JSON.parse(match[0]);
  }

  if (!Array.isArray(arr)) {
    throw new Error("LLM7 response was not a JSON array");
  }

  // Ensure same length as input; pad/truncate defensively.
  const out: string[] = [];
  for (let i = 0; i < texts.length; i++) {
    const v = arr[i];
    out.push(typeof v === "string" ? v : texts[i] ?? "");
  }
  return out;
}

export async function POST(req: NextRequest) {
  let body: TranslateBody;
  try {
    body = (await req.json()) as TranslateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    return NextResponse.json(
      { ok: false, error: "entries[] is required" },
      { status: 400 },
    );
  }

  const target = body.target ?? "tr";
  const source = body.source ?? "en";

  try {
    const allEntries = body.entries as Entry[];

    // Process in batches to keep prompts within token budget.
    const batches: Entry[][] = [];
    for (let i = 0; i < allEntries.length; i += MAX_BATCH) {
      batches.push(allEntries.slice(i, i + MAX_BATCH));
    }

    const translated: Entry[] = [];
    for (const batch of batches) {
      const texts = batch.map((e) => e.text);
      const translatedTexts = await translateBatch(texts, source, target);
      for (let i = 0; i < batch.length; i++) {
        translated.push({
          start: batch[i].start,
          dur: batch[i].dur,
          text: translatedTexts[i] ?? batch[i].text,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      source,
      target,
      entryCount: translated.length,
      entries: translated,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Translation failed" },
      { status: 500 },
    );
  }
}

/**
 * Health check endpoint — GET /api/translate returns service info.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "translate",
    backend: "LLM7 (api.llm7.io)",
    model: LLM7_MODEL,
    apiKeyRequired: false,
    note: "LLM7 is OpenAI-compatible and accepts any API key (use 'unused').",
  });
}
