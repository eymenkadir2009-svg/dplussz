// Goothiah TV — Service Worker
// Provides offline caching for the app shell and static assets.

const CACHE_NAME = "goothiah-tv-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.svg",
  "/robots.txt",
];

// Install — pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual fetches so one failure doesn't block the rest
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url)
            .then((res) => (res.ok ? cache.put(url, res) : null))
            .catch(() => null)
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first for pages, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (YouTube, images, API calls)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip API routes — they need to be live
  if (url.pathname.startsWith("/api/")) return;

  // Skip Next.js internal routes
  if (url.pathname.startsWith("/_next/")) {
    // Cache-first for _next/static (immutable assets)
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return res;
          })
        );
      })
    );
    return;
  }

  // Network-first for pages — fall back to cache when offline
  event.respondWith(
    fetch(request)
      .then((res) => {
        // Cache successful responses
        if (res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() => {
        // Offline — try cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // If navigating to a page and no cache, serve the app shell
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });
      })
  );
});
