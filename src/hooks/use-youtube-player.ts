"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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
  captionsEnabled: boolean;
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
  captionsEnabled: false,
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

  // Track pending caption request — applied once the captions module is ready
  const pendingCaptionsRef = useRef<boolean>(false);

  useEffect(() => {
    if (!videoId) return;
    let disposed = false;

    loadYouTubeAPI().then(() => {
      if (disposed) return;
      const YT = window.YT;
      if (!YT || !YT.Player) return;

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
          // Load captions module on init — YouTube will auto-detect
          // available caption tracks and we can enable auto-translation.
          cc_load_policy: 1,
          cc_lang_pref: "en",
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

            // Hide captions initially — user enables via button
            try {
              p.loadModule?.("captions");
              setTimeout(() => {
                try {
                  p.setOption("captions", "visibility", false);
                } catch {
                  /* ignore */
                }
              }, 800);
            } catch {
              /* ignore */
            }
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

            // When video starts playing, apply pending caption request
            if (isPlaying && pendingCaptionsRef.current) {
              setTimeout(() => applyCaptionTranslation(), 500);
            }
          },
          onApiChange: () => {
            // Captions module API is now available
            if (pendingCaptionsRef.current) {
              applyCaptionTranslation();
            }
          },
          onPlaybackQualityChange: () => {},
          onError: () => {
            setState((s) => ({ ...s, ready: true }));
          },
        },
      });
    });

    // Poll for time/buffered updates
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

    /**
     * Apply YouTube native auto-translation to Turkish.
     * Called from onApiChange, onReady, and onStateChange (PLAYING).
     * Retries up to 10 times with 1s delays.
     */
    function applyCaptionTranslation(attempt = 0) {
      const p = playerRef.current;
      if (!p || disposed) return;

      try {
        // Load the captions module
        p.loadModule?.("captions");

        // Set the source caption track to English
        p.setOption("captions", "track", { languageCode: "en" });

        // Set auto-translation to Turkish — this is the key step!
        // YouTube will translate the English captions to Turkish automatically.
        p.setOption("captions", "translationLanguage", {
          languageCode: "tr",
          languageName: "Turkish",
        });

        // Make captions visible
        p.setOption("captions", "visibility", true);

        setState((s) => ({ ...s, captionsEnabled: true }));
      } catch {
        // Retry up to 10 times — the captions module may take time to load
        if (attempt < 10 && !disposed) {
          setTimeout(() => applyCaptionTranslation(attempt + 1), 1000);
        }
      }
    }

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
      pendingCaptionsRef.current = false;
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

  /**
   * Enable YouTube native captions with auto-translation to Turkish.
   * Sets the pending flag — the actual caption settings are applied
   * by applyCaptionTranslation() which is called from onApiChange,
   * onReady, and onStateChange (PLAYING).
   */
  const enableCaptions = useCallback(() => {
    pendingCaptionsRef.current = true;
    // Try immediately
    const p = playerRef.current;
    if (p) {
      try {
        p.loadModule?.("captions");
        p.setOption("captions", "track", { languageCode: "en" });
        p.setOption("captions", "translationLanguage", {
          languageCode: "tr",
          languageName: "Turkish",
        });
        p.setOption("captions", "visibility", true);
        setState((s) => ({ ...s, captionsEnabled: true }));
      } catch {
        /* will be retried by onApiChange/onStateChange */
      }
    }
  }, []);

  /**
   * Disable YouTube native captions.
   */
  const disableCaptions = useCallback(() => {
    pendingCaptionsRef.current = false;
    const p = playerRef.current;
    if (!p) return;
    try {
      p.setOption("captions", "visibility", false);
      setState((s) => ({ ...s, captionsEnabled: false }));
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
    enableCaptions,
    disableCaptions,
  };
}
