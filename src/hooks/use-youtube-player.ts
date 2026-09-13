"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Minimal type declarations for the YouTube IFrame API.
 */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YouTubePlayerState {
  ready: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  ended: boolean;
}

export const initialPlayerState: YouTubePlayerState = {
  ready: false,
  playing: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 100,
  muted: false,
  ended: false,
};

let apiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    document.head.appendChild(tag);
  });

  return apiPromise;
}

export function useYouTubePlayer(
  containerId: string,
  videoId: string | null | undefined,
) {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<YouTubePlayerState>(initialPlayerState);

  // Initialise / re-initialise player when videoId changes
  useEffect(() => {
    if (!videoId) return;
    let disposed = false;

    loadYouTubeAPI().then(() => {
      if (disposed) return;
      const YT = window.YT;
      if (!YT || !YT.Player) return;

      // destroy any previous instance
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          /* ignore */
        }
        playerRef.current = null;
      }

      playerRef.current = new YT.Player(containerId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          showinfo: 0,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          playsinline: 1,
          // No native captions — we render custom translated subtitles
          // in our own SubtitleOverlay component.
          cc_load_policy: 0,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (e: any) => {
            if (disposed) return;
            const p = e.target;
            setState((s) => ({
              ...s,
              ready: true,
              duration: p.getDuration() || 0,
              volume: p.getVolume() ?? 100,
              muted: p.isMuted?.() ?? false,
            }));
          },
          onStateChange: (e: any) => {
            const YTState = window.YT?.PlayerState;
            if (!YTState) return;
            const isPlaying = e.data === YTState.PLAYING;
            const isEnded = e.data === YTState.ENDED;
            setState((s) => ({
              ...s,
              playing: isPlaying,
              ended: isEnded,
              duration: playerRef.current?.getDuration?.() || s.duration,
            }));
          },
          onPlaybackQualityChange: () => {},
          onError: () => {
            setState((s) => ({ ...s, ready: true }));
          },
        },
      });
    });

    // Poll for time / buffered updates
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || !p.getCurrentTime) return;
      const ct = p.getCurrentTime() || 0;
      const dur = p.getDuration() || 0;
      let buffered = 0;
      try {
        const frac = p.getVideoLoadedFraction?.() ?? 0;
        buffered = frac * dur;
      } catch {
        /* ignore */
      }
      setState((s) => ({
        ...s,
        currentTime: ct,
        duration: dur || s.duration,
        buffered,
      }));
    }, 250);

    return () => {
      disposed = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          /* ignore */
        }
        playerRef.current = null;
      }
      setState(initialPlayerState);
    };
  }, [containerId, videoId]);

  const play = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.playVideo?.();
    } catch {
      /* ignore */
    }
    setState((s) => ({ ...s, playing: true, ended: false }));
  }, []);

  const pause = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.pauseVideo?.();
    } catch {
      /* ignore */
    }
    setState((s) => ({ ...s, playing: false }));
  }, []);

  const seek = useCallback((seconds: number) => {
    const p = playerRef.current;
    if (!p?.seekTo) return;
    try {
      p.seekTo(seconds, true);
    } catch {
      /* ignore */
    }
    setState((s) => ({ ...s, currentTime: seconds, ended: false }));
  }, []);

  const setVolume = useCallback((vol: number) => {
    const p = playerRef.current;
    if (!p?.setVolume) return;
    try {
      p.setVolume(vol);
      if (vol > 0 && p.isMuted?.()) p.unMute();
    } catch {
      /* ignore */
    }
    setState((s) => ({ ...s, volume: vol, muted: vol === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (p.isMuted?.()) {
        p.unMute();
        setState((s) => ({ ...s, muted: false, volume: p.getVolume?.() || 80 }));
      } else {
        p.mute();
        setState((s) => ({ ...s, muted: true }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  return {
    state,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
  };
}
