"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { usePlaylistCache } from "@/hooks/use-playlist-cache";
import { PlayerControls } from "@/components/player-controls";
import { getMovieById } from "@/lib/data";
import { Episode } from "@/lib/types";
import { formatTime } from "@/lib/constants";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ArrowLeft, ChevronRight, Loader2, Play } from "lucide-react";

function toEpisode(
  item: {
    videoId: string;
    title: string;
    description: string;
    thumbnail: string;
    position: number;
    publishedAt: string;
    channelTitle: string;
  },
  idx: number,
  fallbackThumb: string,
): Episode {
  const thumb =
    item.thumbnail && item.thumbnail.startsWith("http")
      ? item.thumbnail
      : fallbackThumb;
  let airDate = "";
  try {
    if (item.publishedAt) {
      const d = new Date(item.publishedAt);
      airDate = d.toISOString().slice(0, 10);
    }
  } catch {
    /* ignore */
  }
  return {
    id: item.videoId,
    episodeNumber: idx + 1,
    seasonNumber: 1,
    title: item.title || `Episode ${idx + 1}`,
    description: item.description || "",
    duration: "",
    thumbnail: thumb,
    youtubeId: item.videoId,
    airDate,
  };
}

export default function WatchClient() {
  const params = useSearchParams();
  const router = useRouter();
  const movieId = params.get("id");
  // Accept either ?v=YouTubeVideoId (new, real videos) or ?ep=episode-id (legacy)
  const vParam = params.get("v");
  const epParam = params.get("ep");

  const movie = getMovieById(movieId);

  const ytPlaylistId = movie?.youtubePlaylistId ?? null;
  const fallbackThumb = movie?.poster ?? "";

  // Cached playlist fetch — subsequent visits to the same show are instant.
  const { items: playlistItems, loading: playlistLoading, error: playlistError } =
    usePlaylistCache(ytPlaylistId);

  // Derive episodes from cached items. (No useMemo — React Compiler handles it.)
  const playlistEps: Episode[] = playlistItems.map((it, i) =>
    toEpisode(it, i, fallbackThumb),
  );
  const hasLoadedPlaylist = !playlistLoading || playlistItems.length > 0;

  // Resolve the current YouTube video ID
  const currentYtId = (() => {
    if (vParam) return vParam;
    if (epParam && hasLoadedPlaylist && playlistEps.length > 0) {
      const found = playlistEps.find((e) => e.id === epParam);
      return found?.youtubeId ?? null;
    }
    return null;
  })();

  // Current episode metadata
  const currentEpisode = currentYtId
    ? playlistEps.find((e) => e.youtubeId === currentYtId)
    : undefined;

  const currentIndex = hasLoadedPlaylist
    ? playlistEps.findIndex((e) => e.youtubeId === currentYtId)
    : -1;
  const nextEpisode =
    currentIndex >= 0 && hasLoadedPlaylist ? playlistEps[currentIndex + 1] : undefined;
  const prevEpisode =
    currentIndex > 0 && hasLoadedPlaylist ? playlistEps[currentIndex - 1] : undefined;

  // Player
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const {
    state,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    enableCaptions,
    disableCaptions,
  } = useYouTubePlayer("yt-player-mount", currentYtId);

  // Fullscreen + auto-rotate to landscape on mobile PWA
  useEffect(() => {
    const onFs = async () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      // Lock orientation to landscape when entering fullscreen
      // (PWA + mobile only — desktop ignores this silently)
      if (isFs) {
        try {
          if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock("landscape");
          }
        } catch {
          /* iOS Safari doesn't support orientation lock — user must rotate manually */
        }
      } else {
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch {
          /* ignore */
        }
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    // Also listen for webkitfullscreenchange for iOS Safari
    document.addEventListener("webkitfullscreenchange", onFs as any);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs as any);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      // Enter fullscreen — use webkitRequestFullscreen for iOS Safari
      const reqFs =
        el.requestFullscreen?.() ??
        (el as any).webkitRequestFullscreen?.() ??
        (el as any).webkitEnterFullscreen?.();
      if (reqFs && typeof reqFs.catch === "function") {
        reqFs.catch(() => {});
      }
    } else {
      // Exit fullscreen
      const exitFs =
        document.exitFullscreen?.() ??
        (document as any).webkitExitFullscreen?.() ??
        (document as any).webkitCancelFullscreen?.();
      if (exitFs && typeof exitFs.catch === "function") {
        exitFs.catch(() => {});
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          if (state.playing) pause();
          else play();
          break;
        case "ArrowLeft":
          if (state.duration) seek(Math.max(0, state.currentTime - 10));
          break;
        case "ArrowRight":
          if (state.duration) seek(Math.min(state.duration, state.currentTime + 10));
          break;
        case "ArrowUp":
          setVolume(Math.min(100, state.volume + 5));
          break;
        case "ArrowDown":
          setVolume(Math.max(0, state.volume - 5));
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, play, pause, seek, setVolume, toggleFullscreen, toggleMute]);

  // Navigation
  const goNext = () => {
    if (nextEpisode && movie) {
      router.push(`/watch?id=${movie.id}&v=${nextEpisode.youtubeId}`);
    }
  };
  const goPrev = () => {
    if (prevEpisode && movie) {
      router.push(`/watch?id=${movie.id}&v=${prevEpisode.youtubeId}`);
    }
  };

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-32 text-center">
          <h1 className="text-3xl font-bold mb-3">Dizi bulunamadı</h1>
          <p className="text-neutral-400 mb-8">
            Aradığınız dizi bulunamadı.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-white text-black font-semibold hover:bg-neutral-200"
          >
            <ArrowLeft className="w-4 h-4" /> Ana sayfaya dön
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // If no video ID is set, show a loading/error state
  if (!currentYtId && !playlistLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-32 text-center">
          <h1 className="text-3xl font-bold mb-3">Video bulunamadı</h1>
          <p className="text-neutral-400 mb-8">
            Bu dizinin YouTube playlist'inden video alınamadı. YOUTUBE_DATA_API_KEY env var'ının ayarlı olduğundan emin olun.
          </p>
          <Link
            href={`/video?id=${movie.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-white text-black font-semibold hover:bg-neutral-200"
          >
            <ArrowLeft className="w-4 h-4" /> Bölüm listesine dön
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />

      {/* Player stage */}
      <div className="pt-20 md:pt-24 px-0">
        <div
          ref={containerRef}
          className="relative w-full bg-black aspect-video max-h-[78vh] mx-auto overflow-hidden"
        >
          {/* YouTube iframe mount — native controls disabled via playerVars.
              pointer-events NOT disabled so YouTube can render captions natively. */}
          <div className="absolute inset-0 w-full h-full">
            <div id="yt-player-mount" className="w-full h-full" />
          </div>

          {/* Hide any YouTube chrome with overlay masks on edges */}
          <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/40" />

          {/* Loading overlay while playlist is being resolved */}
          {playlistLoading && !currentYtId && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
          )}

          <PlayerControls
            state={state}
            title={currentEpisode?.title ?? movie.title}
            subtitle={
              currentIndex >= 0
                ? `Bölüm ${currentIndex + 1} • ${movie.title}`
                : movie.title
            }
            onPlay={play}
            onPause={pause}
            onSeek={seek}
            onVolume={setVolume}
            onToggleMute={toggleMute}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            onNext={goNext}
            onPrev={goPrev}
            hasNext={!!nextEpisode}
            hasPrev={!!prevEpisode}
            videoId={currentYtId}
            onEnableCaptions={enableCaptions}
            onDisableCaptions={disableCaptions}
          />
        </div>

        {/* Below player */}
        <div className="max-w-7xl mx-auto w-full px-4 md:px-10 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
            <div>
              <Link
                href={`/video?id=${movie.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {movie.title} bölüm listesine dön
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold">
                {currentEpisode?.title ?? movie.title}
              </h1>
              <p className="text-neutral-400 mt-1">
                {currentIndex >= 0
                  ? `Bölüm ${currentIndex + 1}${playlistEps ? ` / ${playlistEps.length}` : ""}`
                  : movie.title}
              </p>
              {/* Resume indicator */}
              {state.resumed && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                  Kaldığınız yerden devam ediliyor ({formatTime(state.currentTime)})
                </p>
              )}
            </div>

            {nextEpisode && (
              <button
                onClick={goNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
              >
                Sonraki Bölüm
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Up next list */}
          <h2 className="text-lg md:text-xl font-bold mb-4">
            {movie.title} — Sıradaki Bölümler
          </h2>

          {playlistLoading && (
            <div className="flex items-center justify-center py-10 text-neutral-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Bölümler yükleniyor…
            </div>
          )}

          {!playlistLoading && playlistError && (
            <div className="flex items-start gap-3 p-4 bg-red-950/60 ring-1 ring-red-500/30 rounded-lg">
              <div>
                <p className="font-semibold text-red-200 mb-1">Bölümler yüklenemedi</p>
                <p className="text-sm text-red-300/80">{playlistError}</p>
              </div>
            </div>
          )}

          {!playlistLoading && !playlistError && playlistEps.length === 0 && (
            <div className="text-center py-10 text-neutral-400">
              Bu dizinin playlist'inden video bulunamadı.
            </div>
          )}

          {!playlistLoading && !playlistError && playlistEps.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {playlistEps.map((ep, idx) => {
                const isCurrent = ep.youtubeId === currentYtId;
                const isUpNext = idx === currentIndex + 1;
                return (
                  <Link
                    key={`${ep.id}-${idx}`}
                    href={`/watch?id=${movie.id}&v=${ep.youtubeId}`}
                    className={`group block rounded-lg overflow-hidden ring-1 transition-all ${
                      isCurrent
                        ? "ring-white/40 bg-neutral-900"
                        : "ring-white/5 hover:ring-white/15 bg-neutral-950/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 p-2">
                      <div className="relative w-32 sm:w-36 aspect-video rounded overflow-hidden shrink-0 bg-neutral-900">
                        {ep.thumbnail ? (
                          <img
                            src={ep.thumbnail}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600">
                            <Play className="w-6 h-6" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                        {isCurrent && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-white text-black text-[9px] font-bold uppercase tracking-wider">
                            Şimdi oynatılıyor
                          </div>
                        )}
                        {isUpNext && !isCurrent && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-neutral-900/80 text-white text-[9px] font-bold uppercase tracking-wider">
                            Sıradaki
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-1 pr-1">
                        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
                          Bölüm {idx + 1}
                        </div>
                        <div className="text-sm font-semibold text-white leading-tight line-clamp-2">
                          {ep.title}
                        </div>
                        {ep.airDate && (
                          <div className="text-[11px] text-neutral-500 mt-1">
                            {ep.airDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
