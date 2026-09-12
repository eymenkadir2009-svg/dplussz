"use client";

import Link from "next/link";
import Image from "next/image";
import { Movie } from "@/lib/types";
import { Play, Info } from "lucide-react";

interface HeroSectionProps {
  movie: Movie;
}

export function HeroSection({ movie }: HeroSectionProps) {
  return (
    <section className="relative h-[70vh] md:h-[88vh] w-full overflow-hidden">
      {/* Backdrop */}
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
        {/* Gradient overlays for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end md:justify-center px-4 md:px-12 pb-24 md:pb-12 max-w-4xl">
        <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-neutral-200">
          <span className="px-2 py-0.5 rounded bg-white/15 backdrop-blur-sm">D+SZ Original</span>
          <span className="text-neutral-300">{movie.year} • {movie.rating}</span>
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl">
          {movie.title}
        </h1>

        <div className="mt-3 flex items-center gap-3 text-sm text-neutral-300">
          <span className="font-semibold text-green-400">98% Match</span>
          <span>{movie.year}</span>
          <span className="px-1.5 py-0.5 rounded border border-white/30 text-xs">
            {movie.rating}
          </span>
          <span>{movie.duration}</span>
        </div>

        <p className="mt-4 text-base md:text-lg text-neutral-200 leading-relaxed line-clamp-3 md:line-clamp-5 max-w-2xl">
          {movie.description}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Link
            href={`/video?id=${movie.id}`}
            className="inline-flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 rounded bg-white text-black font-bold hover:bg-neutral-200 transition-colors"
          >
            <Play className="w-5 h-5 fill-black" />
            Play
          </Link>
          <Link
            href={`/video?id=${movie.id}`}
            className="inline-flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 rounded bg-neutral-700/70 backdrop-blur text-white font-semibold hover:bg-neutral-600/70 transition-colors"
          >
            <Info className="w-5 h-5" />
            More Info
          </Link>
        </div>
      </div>

      {/* Maturity rating tab (bottom-right) */}
      <div className="absolute right-0 bottom-24 md:bottom-12 hidden md:flex items-center pl-4 pr-3 py-1 bg-neutral-800/60 border-l-2 border-white text-sm text-white">
        {movie.rating}
      </div>
    </section>
  );
}
