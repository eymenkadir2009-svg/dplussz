"use client";

import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { MovieSlider } from "@/components/movie-slider";
import { Footer } from "@/components/footer";
import { CATEGORIES, getFeaturedMovie } from "@/lib/data";

export default function Home() {
  const featured = getFeaturedMovie();

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <main className="flex-1">
        <HeroSection movie={featured} />

        <div className="relative -mt-24 md:-mt-32 z-10 space-y-10 pb-12">
          {CATEGORIES.map((cat) => (
            <MovieSlider
              key={cat.id}
              id={cat.id}
              title={cat.title}
              movies={cat.movies}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
