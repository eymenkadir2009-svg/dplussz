"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { SITE } from "@/lib/constants";
import { Search, Bell, Menu, X } from "lucide-react";
import { SearchOverlay } from "@/components/search-overlay";
import { NotificationBell } from "@/components/notification-bell";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/#trending", label: "Trending" },
    { href: "/#originals", label: "Originals" },
    { href: "/#drama", label: "Drama" },
    { href: "/#fantasy", label: "Fantasy" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/95 backdrop-blur-sm shadow-lg shadow-black/50"
            : "bg-gradient-to-b from-black/90 via-black/60 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-10 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center group" aria-label="D+SZ home">
              <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0">
                <Image
                  src={SITE.logoUrl}
                  alt="D+SZ logo"
                  fill
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <NotificationBell className="hidden sm:block" />
            <button
              aria-label="Profile"
              className="w-8 h-8 rounded bg-gradient-to-br from-neutral-600 to-neutral-800 ring-1 ring-white/10"
            />
            <button
              aria-label="Menu"
              className="md:hidden p-2 text-neutral-300 hover:text-white transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden bg-black/95 backdrop-blur-sm border-t border-white/5 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-neutral-300 hover:text-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Search overlay (full-screen, mounts only when opened) */}
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
