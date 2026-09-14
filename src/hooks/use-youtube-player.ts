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
  /** Whether the player has seeked to the saved resume position. */
  resumed: boolean;
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
  resumed: false,
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

/**
 * Save the current playback position to localStorage so the user can
 * resume from where they left off on their next visit.
 *
 * Key format: `gtv-resume:${videoId}` → number (seconds)
 *
 * We only save if the position is > 5 seconds (skip intros) and
 * < 95% of the duration (don't resume at the end).
 */
const RESUME_PREFIX = "gtv-resume:";
const RESUME_SAVE_INTERVAL = 5000; // save every 5 seconds

function saveResumePosition(videoId: string, currentTime: number, duration: number) {
  if (typeof window === "undefined") return;
  if (!videoId || !duration) return;
  // Don't save if we're at the very beginning or near the end
  if (currentTime < 5) return;
  if (duration > 0 && currentTime / duration > 0.95) {
    // Video is basically done — clear the saved position
    window.localStorage.removeItem(RESUME_PREFIX + videoId);
    return;
  }
  try {
    window.localStorage.setItem(RESUME_PREFIX + videoId, String(Math.floor(currentTime)));
  } catch {
    /* localStorage might be full or disabled */
  }
}

function loadResumePosition(videoId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(RESUME_PREFIX + videoId);
    if (!raw) return 0;
    const seconds = parseFloat(raw);
    return isFinite(seconds) && seconds > 0 ? seconds : 0;
  } catch {
    return 0;
  }
}

function clearResumePosition(videoId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RESUME_PREFIX + videoId);
  } catch {
    /* ignore */
  }
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

  /**
   * Apply YouTube native auto-translation to Turkish.
   * This is defined with useCallback so it's accessible from both
   * the event handlers (onApiChange, onStateChange) and the
   * enableCaptions() method.
   *
   * Retries up to 15 times with 800ms delays — the captions module
   * can take several seconds to load, especially on mobile.
   */
  const applyCaptionTranslation = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;

    let attempt = 0;

    function tryApply() {
      const pp = playerRef.current;
      if (!pp) return;

      try {
        // Load the captions module
        pp.loadModule?.("captions");

        // Set the source caption track to English
        pp.setOption("captions", "track", { languageCode: "en" });

        // Set auto-translation to Turkish
        pp.setOption("captions", "translationLanguage", {
          languageCode: "tr",
          languageName: "Turkish",
        });

        // Make captions visible
        pp.setOption("captions", "visibility", true);

        setState((s) => ({ ...s, captionsEnabled: true }));
      } catch {
        // Retry up to 15 times with 800ms delays
        attempt++;
        if (attempt <= 15) {
          setTimeout(tryApply, 800);
        }
      }
    }

    tryApply();
  }, []);

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
          // Load captions module on init
          cc_load_policy: 1,
          cc_lang_pref: "en",
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (e: any) => {
            if (disposed) return;
            const p = e.target;
            const dur = p.getDuration() || 0;
            setState((s) => ({
              ...s,
              ready: true,
              duration: dur,
              volume: p.getVolume() ?? 100,
              muted: p.isMuted?.() ?? false,
            }));

            // --- Resume from saved position ---
            // Read the saved playback position from localStorage and seek to it.
            // This lets users continue watching from where they left off.
            const savedPos = loadResumePosition(videoId);
            if (savedPos > 5 && dur > 0 && savedPos < dur * 0.95) {
              try {
                p.seekTo?.(savedPos, true);
                setState((s) => ({
                  ...s,
                  currentTime: savedPos,
                  resumed: true,
                }));
              } catch {
                /* ignore */
              }
            }

            // Pre-load captions module so it's ready when user clicks the button
            try {
              p.loadModule?.("captions");
              // Hide captions initially
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

            // Apply pending caption request if one was queued
            if (pendingCaptionsRef.current) {
              setTimeout(() => applyCaptionTranslation(), 1000);
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

            // When video starts playing, apply pending caption request.
            // This is especially important on mobile where the captions
            // module loads later than on desktop.
            if (isPlaying && pendingCaptionsRef.current) {
              setTimeout(() => applyCaptionTranslation(), 500);
            }
          },
          onApiChange: () => {
            // Captions module API is now available — apply pending request
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

    // Poll for time/buffered updates + save resume position
    let lastSaveTime = 0;
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

      // Save resume position every 5 seconds (or when near the end)
      const now = Date.now();
      if (now - lastSaveTime >= RESUME_SAVE_INTERVAL) {
        lastSaveTime = now;
        saveResumePosition(videoId, ct, dur);
      }
      // Also save immediately if the video ended
      if (dur > 0 && ct / dur > 0.95) {
        clearResumePosition(videoId);
      }
    }, 250);

    return () => {
      disposed = true;
      // Save final position before unmounting
      const p = playerRef.current;
      if (p && p.getCurrentTime && videoId) {
        try {
          const ct = p.getCurrentTime() || 0;
          const dur = p.getDuration() || 0;
          saveResumePosition(videoId, ct, dur);
        } catch {
          /* ignore */
        }
      }
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
  }, [containerId, videoId, applyCaptionTranslation]);

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
   * Sets the pending flag and calls applyCaptionTranslation() which
   * retries up to 15 times — the captions module may take several
   * seconds to load, especially on mobile devices.
   */
  const enableCaptions = useCallback(() => {
    pendingCaptionsRef.current = true;
    // Try immediately
    applyCaptionTranslation();
    // Also try after 2s and 5s in case the module loads late
    setTimeout(() => {
      if (pendingCaptionsRef.current) applyCaptionTranslation();
    }, 2000);
    setTimeout(() => {
      if (pendingCaptionsRef.current) applyCaptionTranslation();
    }, 5000);
  }, [applyCaptionTranslation]);

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
