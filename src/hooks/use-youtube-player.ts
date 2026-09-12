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
  captionsReady: boolean;
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
  captionsReady: false,
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

  // Keep track of pending caption requests so we can apply them once
  // the captions module becomes available.
  const pendingCaptionsRef = useRef<{
    lang: string;
    translateTo?: string;
  } | null>(null);

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
          // Allow captions to be loaded — we control visibility via the API.
          // Without cc_load_policy=1, the captions module may not initialize.
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

            // Try to load the captions module immediately on ready.
            // The module might not be available yet, but we try anyway —
            // onApiChange will fire later if the module becomes available.
            try {
              p.loadModule?.("captions");
              // Hide captions initially — user enables them via the button.
              setTimeout(() => {
                try {
                  p.setOption("captions", "visibility", false);
                } catch {
                  /* ignore */
                }
              }, 500);
            } catch {
              /* ignore */
            }

            // Apply pending caption request if one was queued before ready.
            const pending = pendingCaptionsRef.current;
            if (pending) {
              pendingCaptionsRef.current = null;
              setTimeout(() => {
                try {
                  p.setOption("captions", "track", { languageCode: pending.lang });
                  if (pending.translateTo) {
                    p.setOption("captions", "translationLanguage", {
                      languageCode: pending.translateTo,
                      languageName:
                        pending.translateTo === "tr"
                          ? "Turkish"
                          : pending.translateTo,
                    });
                  }
                  p.setOption("captions", "visibility", true);
                  setState((s) => ({ ...s, captionsEnabled: true, captionsReady: true }));
                } catch {
                  /* ignore */
                }
              }, 1000);
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
          },
          onApiChange: () => {
            // The captions module API is now available. Apply any pending
            // caption requests.
            const p = playerRef.current;
            if (!p) return;
            try {
              // Check if the captions module is available
              const modules = p.getAvailableModules?.() ?? [];
              if (modules.includes("captions") || p.getOption) {
                p.loadModule?.("captions");
                setState((s) => ({ ...s, captionsReady: true }));

                // Apply pending caption request
                const pending = pendingCaptionsRef.current;
                if (pending) {
                  pendingCaptionsRef.current = null;
                  try {
                    p.setOption("captions", "track", {
                      languageCode: pending.lang,
                    });
                    if (pending.translateTo) {
                      p.setOption("captions", "translationLanguage", {
                        languageCode: pending.translateTo,
                        languageName:
                          pending.translateTo === "tr"
                            ? "Turkish"
                            : pending.translateTo,
                      });
                    }
                    p.setOption("captions", "visibility", true);
                    setState((s) => ({ ...s, captionsEnabled: true }));
                  } catch {
                    /* ignore */
                  }
                }
              }
            } catch {
              /* ignore */
            }
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
      pendingCaptionsRef.current = null;
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
   * Enable YouTube native captions with auto-translation.
   *
   * Tries multiple times with delays because the captions module may not
   * be immediately available after onReady.
   */
  const enableCaptions = useCallback(
    (lang: string, translateTo?: string) => {
      const p = playerRef.current;
      if (!p) return;

      // Store the request so onApiChange can apply it if the module
      // isn't ready yet.
      pendingCaptionsRef.current = { lang, translateTo };

      const applyCaptions = (attempt: number) => {
        try {
          p.loadModule?.("captions");
          p.setOption("captions", "track", { languageCode: lang });
          if (translateTo) {
            p.setOption("captions", "translationLanguage", {
              languageCode: translateTo,
              languageName:
                translateTo === "tr" ? "Turkish" : translateTo,
            });
          }
          p.setOption("captions", "visibility", true);
          setState((s) => ({ ...s, captionsEnabled: true, captionsReady: true }));
        } catch {
          // Retry up to 3 times with increasing delays
          if (attempt < 3) {
            setTimeout(() => applyCaptions(attempt + 1), 1000 * (attempt + 1));
          }
        }
      };

      // Start immediately
      applyCaptions(0);
    },
    [],
  );

  /**
   * Disable YouTube native captions.
   */
  const disableCaptions = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    pendingCaptionsRef.current = null;
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
