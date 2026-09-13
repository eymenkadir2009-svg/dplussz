"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SubtitleEntry {
  start: number;
  dur: number;
  text: string;
}

interface LanguageButtonProps {
  videoId: string | null | undefined;
  enabled: boolean;
  onToggle: (entries: SubtitleEntry[] | null) => void;
  isActive: boolean;
}

type Status = "idle" | "fetching" | "translating" | "ready" | "error";

/**
 * Language selector button with a Turkish flag icon.
 *
 * When clicked:
 * 1. Fetches the video's transcript via /api/transcript (server-side,
 *    uses youtube-transcript package to fetch real YouTube captions)
 * 2. Translates the entries to Turkish via /api/translate (LLM7)
 * 3. Passes the translated entries to the parent via onToggle()
 * 4. The parent renders them in the custom SubtitleOverlay
 *
 * If the video has no captions, shows a user-friendly error.
 */
export function LanguageButton({
  videoId,
  enabled,
  onToggle,
  isActive,
}: LanguageButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (isActive) {
      onToggle(null);
      setStatus("idle");
      setError(null);
      return;
    }
    if (!videoId) return;

    setStatus("fetching");
    setError(null);

    try {
      // Step 1: Fetch transcript
      const res = await fetch(
        `/api/transcript?videoId=${encodeURIComponent(videoId)}&lang=en`,
      );
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error ?? "Transcript fetch failed");
      }
      const entries: SubtitleEntry[] = data.entries ?? [];
      if (entries.length === 0) {
        throw new Error("Bu videoda altyazı bulunamadı.");
      }

      // Step 2: Translate to Turkish
      setStatus("translating");
      const tr = await fetch(`/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries,
          source: data.sourceLanguage ?? "en",
          target: "tr",
        }),
      });
      const trData = await tr.json();
      if (!trData.ok) {
        throw new Error(trData.error ?? "Çeviri başarısız oldu");
      }
      const translated: SubtitleEntry[] = trData.entries ?? [];
      if (translated.length === 0) {
        throw new Error("Çeviri sonucu boş.");
      }

      // Step 3: Pass to parent to render in custom overlay
      onToggle(translated);
      setStatus("ready");
    } catch (e: any) {
      setError(e?.message ?? "Altyazılar yüklenemedi");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  const isLoading = status === "fetching" || status === "translating";

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!enabled || isLoading}
        onClick={handleClick}
        className={`relative flex items-center gap-2 px-3 py-2 rounded-md ring-1 transition-all ${
          isActive
            ? "bg-white text-black ring-white"
            : "bg-black/60 text-white ring-white/30 hover:bg-black/80 hover:ring-white/60"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Toggle Turkish subtitles"
        title={
          status === "fetching"
            ? "Altyazı çekiliyor…"
            : status === "translating"
              ? "Türkçe'ye çevriliyor…"
              : status === "error"
                ? error ?? "Hata"
                : "Türkçe altyazı (otomatik çeviri)"
        }
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <TurkishFlagIcon className="w-5 h-5" />
        )}
        <span className="text-xs font-semibold hidden md:block">
          {isActive
            ? "TR · ON"
            : status === "fetching"
              ? "Çekiliyor…"
              : status === "translating"
                ? "Çevriliyor…"
                : "TR"}
        </span>
      </button>
      {status === "error" && error && (
        <div className="absolute bottom-full mb-2 right-0 max-w-xs px-3 py-2 rounded bg-black/95 text-white text-xs ring-1 ring-red-500/40 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Turkish flag rendered as inline SVG.
 */
export function TurkishFlagIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 400"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <rect width="600" height="400" fill="#E30A17" />
      <circle cx="220" cy="200" r="80" fill="#FFFFFF" />
      <circle cx="245" cy="200" r="68" fill="#E30A17" />
      <g transform="translate(330, 200) rotate(-18)">
        <polygon
          points="0,-50 14.69,-22.45 45.29,-22.45 20.29,4.55 32.04,38.78 0,18.18 -32.04,38.78 -20.29,4.55 -45.29,-22.45 -14.69,-22.45"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}

export type { SubtitleEntry };
