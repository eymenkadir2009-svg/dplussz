"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getMovieById } from "@/lib/data";
import { Episode } from "@/lib/types";
import { usePlaylistCache } from "@/hooks/use-playlist-cache";
import { Play, ArrowLeft, Star, Calendar, Clock, Loader2, AlertCircle } from "lucide-react";

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

export default function VideoClient() {
  const params = useSearchParams();
  const movieId = params.get("id");
  const movie = getMovieById(movieId);

  const ytPlaylistId = movie?.youtubePlaylistId ?? null;
  const fallbackThumb = movie?.poster ?? "";

  // Cached playlist fetch — subsequent visits to the same show are instant.
  const { items, loading, error } = usePlaylistCache(ytPlaylistId);

  // Compute episodes from cached items. (No useMemo — React Compiler handles it.)
  const episodes: Episode[] = items.map((it, idx) =>
    toEpisode(it, idx, fallbackThumb),
  );
  const firstEpId = episodes[0]?.id;

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main className="pt-32 pb-16 px-4 md:px-10 max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Dizi bulunamadı</h1>
          <p className="text-neutral-400 mb-8">
            Aradığınız dizi bulunamadı.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-white text-black font-semibold hover:bg-neutral-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana sayfaya dön
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />

      {/* Hero of the show */}
      <section className="relative h-[55vh] md:h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={movie.backdrop}
            alt={`${movie.title} backdrop`}
            fill
            className="object-cover"
            sizes="100vw"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="relative h-full flex flex-col justify-end px-4 md:px-12 pb-10 max-w-3xl pt-32">
          <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-neutral-200">
            <span className="px-2 py-0.5 rounded bg-white/15 backdrop-blur-sm">D+SZ</span>
            <span>{loading ? "Yükleniyor…" : `${episodes.length} Bölüm`}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-2xl">
            {movie.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-300">
            <span className="inline-flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-white">8.9</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {movie.year}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" /> {movie.duration}
            </span>
            <span className="px-1.5 py-0.5 rounded border border-white/30 text-xs">
              {movie.rating}
            </span>
            {movie.genres.map((g) => (
              <span key={g} className="text-neutral-400">{g}</span>
            ))}
          </div>

          <p className="mt-4 text-base text-neutral-200 leading-relaxed line-clamp-3 md:line-clamp-4 max-w-2xl">
            {movie.description}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href={firstEpId ? `/watch?id=${movie.id}&v=${firstEpId}` : "#"}
              className={`inline-flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 rounded font-bold transition-colors ${
                firstEpId
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              1. Bölümü Oynat
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 md:py-3 rounded bg-neutral-700/70 backdrop-blur text-white font-semibold hover:bg-neutral-600/70 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </Link>
          </div>
        </div>
      </section>

      {/* Episode list */}
      <main className="flex-1 px-4 md:px-12 py-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            {movie.title} — Bölümler
          </h2>
          <span className="text-sm text-neutral-400">
            {loading ? "Yükleniyor…" : `${episodes.length} Bölüm`}
          </span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            YouTube playlist'ten bölümler yükleniyor…
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex items-start gap-3 p-4 bg-red-950/60 ring-1 ring-red-500/30 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200 mb-1">Bölümler yüklenemedi</p>
              <p className="text-sm text-red-300/80">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && episodes.length === 0 && (
          <div className="text-center py-20 text-neutral-400">
            Bu playlist'te henüz video bulunamadı.
          </div>
        )}

        {/* Episode grid */}
        {!loading && episodes.length > 0 && (
          <div className="space-y-3">
            {episodes.map((ep, idx) => (
              <Link
                key={`${ep.id}-${idx}`}
                href={`/watch?id=${movie.id}&v=${ep.id}`}
                className="group block bg-neutral-950/60 hover:bg-neutral-900 ring-1 ring-white/5 hover:ring-white/15 rounded-lg overflow-hidden transition-all"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative sm:w-[280px] md:w-[340px] aspect-video sm:aspect-auto shrink-0 overflow-hidden bg-neutral-900">
                    {ep.thumbnail ? (
                      <Image
                        src={ep.thumbnail}
                        alt={ep.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 340px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <Play className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="w-14 h-14 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl">
                        <Play className="w-6 h-6 fill-black" />
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded bg-black/70 text-[10px] font-semibold tracking-wider uppercase text-white">
                      Bölüm {idx + 1}
                    </div>
                  </div>

                  <div className="flex-1 p-4 md:p-6 flex flex-col justify-center">
                    <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                        {idx + 1}. {ep.title}
                      </h3>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed line-clamp-3">
                      {ep.description || `${movie.title} — Bölüm ${idx + 1}`}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-500">
                      {ep.airDate && <span>{ep.airDate}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
