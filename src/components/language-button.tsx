"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface LanguageButtonProps {
  /**
   * Callback to enable YouTube native captions with Turkish auto-translation.
   * Called when the user clicks the button to turn subtitles ON.
   */
  onEnable: () => void;
  /**
   * Callback to disable YouTube native captions.
   * Called when the user clicks the button to turn subtitles OFF.
   */
  onDisable: () => void;
  /**
   * Whether captions are currently enabled (controlled by the parent).
   */
  isActive: boolean;
  /**
   * Whether the player is ready to accept caption commands.
   */
  enabled: boolean;
}

/**
 * Language selector button with a Turkish flag icon.
 *
 * When clicked, it enables YouTube's native captions module and sets
 * the translation language to Turkish. YouTube handles both the caption
 * fetching and the translation automatically — no server-side API calls
 * needed.
 *
 * This approach is much more reliable than fetching transcripts server-side
 * (which YouTube blocks with "Sign in to confirm you're not a bot") because:
 * - The captions are loaded directly by the YouTube iframe player
 * - YouTube handles the translation natively
 * - No API key or CORS proxy needed
 * - Works for any video that has captions (auto-generated or manual)
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
    // Brief loading state to give feedback
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!enabled}
        onClick={handleClick}
        className={`relative flex items-center gap-2 px-3 py-2 rounded-md ring-1 transition-all ${
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
        <span className="text-xs font-semibold hidden md:block">
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
