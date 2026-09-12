"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Loader2,
} from "lucide-react";
import { YouTubePlayerState } from "@/hooks/use-youtube-player";
import { formatTime } from "@/lib/constants";
import { LanguageButton } from "@/components/language-button";

interface PlayerControlsProps {
  state: YouTubePlayerState;
  title: string;
  subtitle?: string;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (sec: number) => void;
  onVolume: (vol: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  videoId?: string | null;
  /** Enable YouTube native captions with Turkish auto-translation */
  onEnableCaptions: (lang: string, translateTo?: string) => void;
  /** Disable YouTube native captions */
  onDisableCaptions: () => void;
}

export function PlayerControls({
  state,
  title,
  subtitle,
  onPlay,
  onPause,
  onSeek,
  onVolume,
  onToggleMute,
  onToggleFullscreen,
  isFullscreen,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  videoId,
  onEnableCaptions,
  onDisableCaptions,
}: PlayerControlsProps) {
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls when playing & not dragging
  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  }, []);

  const wake = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (state.playing) {
      scheduleHide();
    } else {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [state.playing, scheduleHide]);

  // Track mouse position so we can re-show controls when the cursor moves
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const h = rect.height;
      if (y > h - 180 || y < 100) {
        wake();
      }
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [wake]);

  // Effective visibility for the *controls bar & title*
  const effectiveVisible = showControls || !state.playing || isDragging;

  // Scrubbing math
  const getSecondsFromEvent = (clientX: number) => {
    const el = progressRef.current;
    if (!el || !state.duration) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return ratio * state.duration;
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    const t = getSecondsFromEvent(e.clientX);
    onSeek(t);
  };

  const handleProgressMove = (e: React.MouseEvent) => {
    if (!isDragging) {
      setHoverTime(getSecondsFromEvent(e.clientX));
    } else {
      const t = getSecondsFromEvent(e.clientX);
      onSeek(t);
    }
  };

  const handleProgressLeave = () => {
    setHoverTime(null);
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const t = getSecondsFromEvent(e.clientX);
    onSeek(t);
    const onMove = (ev: MouseEvent) => {
      const el = progressRef.current;
      if (!el || !state.duration) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(Math.max((ev.clientX - rect.left) / rect.width, 0), 1);
      onSeek(ratio * state.duration);
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const pct = state.duration ? (state.currentTime / state.duration) * 100 : 0;
  const bufferedPct = state.duration ? (state.buffered / state.duration) * 100 : 0;
  const hoverPct =
    hoverTime !== null && state.duration
      ? (hoverTime / state.duration) * 100
      : null;

  const VolIcon = state.muted || state.volume === 0 ? VolumeX : state.volume < 50 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 player-controls"
      style={{ opacity: effectiveVisible ? 1 : 0 }}
      onMouseMove={wake}
      onMouseLeave={() => state.playing && setShowControls(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (state.playing) onPause();
          else onPlay();
        }
      }}
    >
      {/* Top gradient + title */}
      <div className="player-gradient-top absolute top-0 left-0 right-0 px-6 md:px-10 pt-5 pb-20 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {subtitle && (
            <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-300 mb-1.5 leading-none">
              {subtitle}
            </div>
          )}
          <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg leading-tight line-clamp-2">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-neutral-200 shrink-0">
          <button
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center play / pause big button */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {!state.playing && state.ready && (
          <button
            onClick={onPlay}
            className="pointer-events-auto w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
            aria-label="Play"
          >
            <Play className="w-10 h-10 fill-black ml-1" />
          </button>
        )}
        {!state.ready && (
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        )}
      </div>

      {/* Bottom controls bar */}
      <div className="player-gradient-bottom absolute bottom-0 left-0 right-0 px-4 md:px-10 pb-4 md:pb-6 pt-16">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="group/progress relative h-4 flex items-center cursor-pointer mb-3"
          onClick={handleProgressClick}
          onMouseMove={handleProgressMove}
          onMouseLeave={handleProgressLeave}
          onMouseDown={startDrag}
        >
          <div className="relative w-full h-1 group-hover/progress:h-1.5 transition-all bg-white/25 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-white/30"
              style={{ width: `${bufferedPct}%` }}
            />
            <div
              className="absolute top-0 left-0 h-full bg-white"
              style={{ width: `${pct}%` }}
            />
            {hoverPct !== null && (
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white/40"
                style={{ left: `${hoverPct}%` }}
              />
            )}
          </div>
          <div
            className="player-progress-thumb absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md"
            style={{
              left: `${pct}%`,
              opacity: isDragging ? 1 : 0,
              transitionDuration: isDragging ? "0ms" : "200ms",
            }}
          />
          <div
            className="player-progress-thumb absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white opacity-0 group-hover/progress:opacity-100"
            style={{ left: `${pct}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={state.playing ? onPause : onPlay}
              className="text-white hover:text-neutral-200 transition-colors"
              aria-label={state.playing ? "Pause" : "Play"}
            >
              {state.playing ? (
                <Pause className="w-7 h-7 fill-white" />
              ) : (
                <Play className="w-7 h-7 fill-white" />
              )}
            </button>

            {onPrev && (
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="text-white hover:text-neutral-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Previous chapter"
              >
                <SkipBack className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={() => onSeek(Math.max(0, state.currentTime - 10))}
              className="text-white hover:text-neutral-200 transition-colors hidden sm:block"
              aria-label="Rewind 10 seconds"
            >
              <span className="relative inline-flex items-center justify-center w-8 h-8">
                <SkipForward className="w-7 h-7 -scale-x-100" />
                <span className="absolute text-[8px] font-bold">10</span>
              </span>
            </button>

            <button
              onClick={() => onSeek(Math.min(state.duration, state.currentTime + 10))}
              className="text-white hover:text-neutral-200 transition-colors hidden sm:block"
              aria-label="Forward 10 seconds"
            >
              <span className="relative inline-flex items-center justify-center w-8 h-8">
                <SkipForward className="w-7 h-7" />
                <span className="absolute text-[8px] font-bold">10</span>
              </span>
            </button>

            {onNext && (
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="text-white hover:text-neutral-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Next chapter"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            )}

            <div className="group/vol flex items-center gap-2 shrink-0">
              <button
                onClick={onToggleMute}
                className="text-white hover:text-neutral-200 transition-colors"
                aria-label={state.muted ? "Unmute" : "Mute"}
              >
                <VolIcon className="w-6 h-6" />
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={state.muted ? 0 : state.volume}
                onChange={(e) => onVolume(Number(e.target.value))}
                className="w-0 group-hover/vol:w-20 transition-all duration-300 accent-white cursor-pointer"
                aria-label="Volume"
              />
            </div>

            <div className="text-xs md:text-sm font-medium text-neutral-200 tabular-nums whitespace-nowrap min-w-[88px] md:min-w-[110px] text-left">
              {formatTime(state.currentTime)} / {formatTime(state.duration)}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            {/* Language button — uses YouTube's native captions module
                with auto-translation to Turkish. No server-side fetch needed. */}
            <LanguageButton
              onEnable={() => onEnableCaptions("en", "tr")}
              onDisable={onDisableCaptions}
              isActive={state.captionsEnabled}
              enabled={state.ready}
            />
            <button
              onClick={onToggleFullscreen}
              className="text-white hover:text-neutral-200 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
