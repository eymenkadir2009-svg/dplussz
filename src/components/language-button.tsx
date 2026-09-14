"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface LanguageButtonProps {
  /** Enable YouTube native captions with Turkish auto-translation */
  onEnable: () => void;
  /** Disable YouTube native captions */
  onDisable: () => void;
  /** Whether captions are currently enabled */
  isActive: boolean;
  /** Whether the player is ready */
  enabled: boolean;
}

/**
 * Language selector button with a Turkish flag icon.
 *
 * When clicked, it enables YouTube's native captions module and sets
 * auto-translation to Turkish. YouTube handles both the caption
 * fetching AND the translation automatically — same as clicking
 * CC → Auto-translate → Turkish on YouTube.com.
 *
 * No server-side API calls needed. Works for any video that has
 * captions (auto-generated or manual).
 */
export function LanguageButton({
  onEnable,
  onDisable,
  isActive,
  enabled,
}: LanguageButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (isActive) {
      onDisable();
      return;
    }
    setLoading(true);
    onEnable();
    // Brief loading indicator
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!enabled}
        onClick={handleClick}
        onTouchStart={(e) => {
          // Prevent double-firing on mobile (touch + click)
          e.preventDefault();
          handleClick();
        }}
        style={{ WebkitTapHighlightColor: "transparent" }}
        className={`relative flex items-center gap-2 px-2.5 py-2 sm:px-3 rounded-md ring-1 transition-all touch-manipulation ${
          isActive
            ? "bg-white text-black ring-white"
            : "bg-black/60 text-white ring-white/30 hover:bg-black/80 hover:ring-white/60"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Toggle Turkish subtitles"
        title={
          isActive
            ? "Türkçe altyazı açık — kapatmak için tıkla"
            : "Türkçe altyazı (YouTube otomatik çeviri)"
        }
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <TurkishFlagIcon className="w-5 h-5" />
        )}
        <span className="text-xs font-semibold hidden sm:block">
          {isActive ? "TR · ON" : "TR"}
        </span>
      </button>
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
