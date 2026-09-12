"use client";

import { useMemo } from "react";
import type { SubtitleEntry } from "./language-button";

interface SubtitleOverlayProps {
  entries: SubtitleEntry[] | null;
  currentTime: number;
}

/**
 * Renders the active subtitle line at the bottom of the player.
 *
 * Picks the latest entry whose start <= currentTime and whose
 * end (start + dur) > currentTime. Returns null if no entry
 * matches.
 */
export function SubtitleOverlay({ entries, currentTime }: SubtitleOverlayProps) {
  const active = useMemo(() => {
    if (!entries || entries.length === 0) return null;
    // Binary search would be faster but entries are small (typically < 200).
    let match: SubtitleEntry | null = null;
    for (const e of entries) {
      if (e.start <= currentTime && e.start + e.dur + 0.3 > currentTime) {
        match = e;
      }
      if (e.start > currentTime) break;
    }
    return match;
  }, [entries, currentTime]);

  if (!active || !active.text) return null;

  return (
    <div className="absolute bottom-24 md:bottom-28 left-0 right-0 z-20 flex justify-center px-8 pointer-events-none">
      <div className="max-w-3xl text-center">
        <span className="inline-block px-4 py-2 rounded-md bg-black/75 text-white text-base md:text-xl font-medium leading-relaxed drop-shadow-lg ring-1 ring-white/5">
          {active.text}
        </span>
      </div>
    </div>
  );
}
