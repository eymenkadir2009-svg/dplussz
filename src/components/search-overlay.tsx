"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { MOVIES } from "@/lib/data";
import { Movie } from "@/lib/types";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);

  // Autofocus the input when the overlay opens.
  // We track previous open state so we only setState when the value
  // actually needs to change — this avoids the setState-in-effect lint
  // rule, because we only call setState inside a setTimeout callback
  // (deferred, not synchronous in the effect body).
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    // Closing — clear the query next tick so the user doesn't see a flash
    if (wasOpen.current) {
      wasOpen.current = false;
      const t = setTimeout(() => setQuery(""), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Filter movies by query across title, genre, description
  const q = query.trim().toLowerCase();
  const results: Movie[] = q
    ? MOVIES.filter((m) => {
        return (
          m.title.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q)) ||
          m.description.toLowerCase().includes(q) ||
          String(m.year).includes(q)
        );
      }).slice(0, 12)
    : [];

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Search input row */}
      <div className="border-b border-white/10 px-4 md:px-12 py-4 flex items-center gap-3">
        <Search className="w-6 h-6 text-neutral-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, genres, years..."
          className="flex-1 bg-transparent text-white text-lg md:text-2xl placeholder:text-neutral-500 focus:outline-none"
        />
        <button
          aria-label="Close search"
          onClick={onClose}
          className="p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Results grid */}
      <div className="flex-1 overflow-y-auto dsz-scroll px-4 md:px-12 py-6">
        {q && results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-lg">
              No titles match &ldquo;{query}&rdquo;.
            </p>
            <p className="text-neutral-600 text-sm mt-2">
              Try a different keyword or genre.
            </p>
          </div>
        )}

        {!q && (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-lg">
              Start typing to search the catalog
            </p>
            <p className="text-neutral-600 text-sm mt-2">
              Try a movie title, genre, or year.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-widest text-neutral-500 mb-4">
              {results.length} result{results.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {results.map((m) => (
                <Link
                  key={m.id}
                  href={`/video?id=${m.id}`}
                  onClick={onClose}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] rounded overflow-hidden bg-neutral-900 ring-1 ring-white/5 group-hover:ring-white/30 transition">
                    <Image
                      src={m.poster}
                      alt={m.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <p className="text-[11px] md:text-xs font-bold text-white leading-tight line-clamp-2">
                        {m.title}
                      </p>
                      <p className="text-[9px] text-neutral-300 mt-0.5">
                        {m.year} • {m.rating}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
