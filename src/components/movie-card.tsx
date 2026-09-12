"use client";

import Link from "next/link";
import Image from "next/image";
import { Movie } from "@/lib/types";
import { Play, Plus, Info, ChevronDown } from "lucide-react";
import { useState } from "react";

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/video?id=${movie.id}`}
      className="group relative shrink-0 w-[180px] md:w-[210px] transition-transform duration-300 hover:scale-105 hover:z-20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-card-index={index}
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-neutral-900 ring-1 ring-white/5 shadow-lg shadow-black/40">
        <Image
          src={movie.poster}
          alt={`${movie.title} poster`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 180px, 210px"
          unoptimized
          loading="lazy"
        />

        {/* Top badge */}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-black/80 text-white backdrop-blur-sm">
          {movie.rating}
        </div>

        {/* Bottom gradient — keeps always-visible text legible */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

        {/* Card text — always visible, fades out on hover */}
        <div
          className={`absolute inset-x-0 bottom-0 p-3 pointer-events-none transition-opacity duration-200 ${
            hovered ? "opacity-0" : "opacity-100"
          }`}
        >
          <h3 className="text-xs md:text-sm font-bold text-white leading-tight line-clamp-1">
            {movie.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-neutral-300">
            <span>{movie.year}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-500" />
            <span>{movie.duration}</span>
          </div>
          <div className="mt-0.5 text-[9px] text-neutral-400 line-clamp-1">
            {movie.genres.join(" • ")}
          </div>
        </div>

        {/* Hover overlay with description + action buttons */}
        <div
          className={`absolute inset-0 bg-black/85 backdrop-blur-[2px] transition-opacity duration-200 flex flex-col justify-end p-3 ${
            hovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Top gradient + rating on top of hover overlay for context */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

          <h3 className="relative text-sm font-bold text-white leading-tight mb-1 line-clamp-2">
            {movie.title}
          </h3>

          <div className="relative flex items-center gap-1.5 text-[9px] text-neutral-300 mb-2">
            <span className="inline-flex items-center gap-1 text-green-400 font-semibold">
              {Math.floor(85 + (movie.title.length % 10))}% Match
            </span>
            <span className="px-1 py-0.5 rounded border border-white/30 text-[8px]">
              {movie.rating}
            </span>
            <span>{movie.year}</span>
            <span className="text-neutral-500">•</span>
            <span>{movie.duration}</span>
          </div>

          <p className="relative text-[10px] text-neutral-300 leading-snug line-clamp-3 mb-2">
            {movie.description}
          </p>

          {/* Genres as small pills, never wrapping awkwardly */}
          <div className="relative flex flex-wrap items-center gap-1 mb-2">
            {movie.genres.map((g) => (
              <span
                key={g}
                className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-white/10 text-neutral-200 ring-1 ring-white/10"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Action buttons row */}
          <div className="relative flex items-center gap-1.5">
            <span
              role="img"
              aria-label="Play"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
            </span>
            <span
              role="img"
              aria-label="Add to list"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-700/80 ring-1 ring-white/20 text-white hover:bg-neutral-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </span>
            <span
              role="img"
              aria-label="More info"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-700/80 ring-1 ring-white/20 text-white hover:bg-neutral-600 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
            </span>
            <span
              role="img"
              aria-label="More like this"
              className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-700/80 ring-1 ring-white/20 text-white hover:bg-neutral-600 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
