"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Movie } from "@/lib/types";
import { MovieCard } from "./movie-card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MovieSliderProps {
  id?: string;
  title: string;
  movies: Movie[];
}

export function MovieSlider({ id, title, movies }: MovieSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows]);

  const scrollByCards = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    // Approximate card width 210 + 12 gap
    const distance = Math.min(el.clientWidth * 0.85, 5 * 222);
    el.scrollBy({ left: dir * distance, behavior: "smooth" });
  };

  return (
    <section id={id} className="relative scroll-mt-24">
      <div className="flex items-center justify-between px-4 md:px-10 mb-3">
        <h2 className="text-lg md:text-2xl font-bold text-white">
          {title}
        </h2>
      </div>

      <div className="relative group/slider">
        {/* Left arrow */}
        <button
          type="button"
          aria-label={`Scroll ${title} left`}
          onClick={() => scrollByCards(-1)}
          disabled={!canLeft}
          className={`absolute left-0 top-0 bottom-0 z-30 w-12 md:w-14 flex items-center justify-center bg-gradient-to-r from-black/90 to-transparent transition-opacity duration-200 ${
            canLeft
              ? "opacity-0 group-hover/slider:opacity-100 cursor-pointer"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/70 ring-1 ring-white/20 text-white hover:bg-black hover:scale-110 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </span>
        </button>

        {/* Cards row */}
        <div
          ref={scrollRef}
          className="no-scrollbar smooth-scroll flex gap-3 overflow-x-auto px-4 md:px-10 pb-2 pt-1"
          style={{ scrollbarWidth: "none" }}
        >
          {movies.map((m, idx) => (
            <MovieCard key={`${m.id}-${idx}`} movie={m} index={idx} />
          ))}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          aria-label={`Scroll ${title} right`}
          onClick={() => scrollByCards(1)}
          disabled={!canRight}
          className={`absolute right-0 top-0 bottom-0 z-30 w-12 md:w-14 flex items-center justify-center bg-gradient-to-l from-black/90 to-transparent transition-opacity duration-200 ${
            canRight
              ? "opacity-0 group-hover/slider:opacity-100 cursor-pointer"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/70 ring-1 ring-white/20 text-white hover:bg-black hover:scale-110 transition-all">
            <ChevronRight className="w-6 h-6" />
          </span>
        </button>
      </div>
    </section>
  );
}
