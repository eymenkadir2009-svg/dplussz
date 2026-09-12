"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Client-side playlist cache.
 *
 * Stores the result of `/api/playlist?playlistId=...` in a module-level
 * in-memory cache so that navigating between /video, /watch and back
 * doesn't trigger a refetch for the same playlist.
 *
 * Cache key is the playlistId. Cache lives for the entire browser
 * session (until the page is hard-reloaded). No expiration is applied
 * because YouTube playlists don't change often.
 */

export interface PlaylistItem {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  position: number;
  publishedAt: string;
  channelTitle: string;
}

type CacheEntry = {
  items: PlaylistItem[];
  promise: Promise<PlaylistItem[]> | null;
  error: string | null;
};

const cache = new Map<string, CacheEntry>();

/**
 * Fetch a YouTube playlist with caching.
 *
 * Returns:
 *   - { items, loading: true } while fetching (or while a previous fetch
 *     is in-flight — duplicate calls share the same promise)
 *   - { items, loading: false, error: null } once fetched successfully
 *   - { items: [], loading: false, error } on failure
 *
 * On success, the result is cached and subsequent calls with the same
 * playlistId return immediately without hitting the network.
 */
export function usePlaylistCache(playlistId: string | null | undefined) {
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!!playlistId);
  const [error, setError] = useState<string | null>(null);
  const currentId = useRef<string | null>(null);

  const fetchPlaylist = useCallback(async (id: string) => {
    // If a cache entry already exists and has items, use it immediately.
    const cached = cache.get(id);
    if (cached && cached.items.length > 0) {
      setItems(cached.items);
      setLoading(false);
      setError(null);
      return cached.items;
    }

    // If a fetch is already in-flight, wait for it instead of duplicating.
    if (cached?.promise) {
      setLoading(true);
      try {
        const result = await cached.promise;
        setItems(result);
        setError(null);
      } catch (e: any) {
        setError(e?.message ?? "fetch failed");
        setItems([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Start a new fetch.
    setLoading(true);
    setError(null);

    const promise = fetch(
      `/api/playlist?playlistId=${encodeURIComponent(id)}&max=100`,
    )
      .then(async (res) => {
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error ?? "Playlist fetch failed");
        }
        const fetched: PlaylistItem[] = data.items ?? [];
        // Update the cache entry with the resolved items.
        const existing = cache.get(id) ?? { items: [], promise: null, error: null };
        cache.set(id, { ...existing, items: fetched, promise: null, error: null });
        return fetched;
      })
      .catch((e) => {
        const msg = e?.message ?? "Playlist fetch failed";
        const existing = cache.get(id) ?? { items: [], promise: null, error: null };
        cache.set(id, { ...existing, promise: null, error: msg });
        throw e;
      });

    // Store the in-flight promise so duplicate callers share it.
    cache.set(id, {
      items: cached?.items ?? [],
      promise,
      error: cached?.error ?? null,
    });

    try {
      const result = await promise;
      setItems(result);
    } catch (e: any) {
      setError(e?.message ?? "fetch failed");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!playlistId) {
      setItems([]);
      setLoading(false);
      setError(null);
      currentId.current = null;
      return;
    }
    if (currentId.current === playlistId) return;
    currentId.current = playlistId;
    fetchPlaylist(playlistId);
  }, [playlistId, fetchPlaylist]);

  /**
   * Force a refetch — bypasses the cache. Useful if the user clicks
   * a "refresh" button or if we suspect the playlist changed.
   */
  const refetch = useCallback(() => {
    if (!playlistId) return;
    cache.delete(playlistId);
    fetchPlaylist(playlistId);
  }, [playlistId, fetchPlaylist]);

  /**
   * Clear the entire cache (all playlists). Useful on logout.
   */
  const clearAll = useCallback(() => {
    cache.clear();
  }, []);

  return { items, loading, error, refetch, clearAll };
}

/**
 * Pre-fetch a playlist without subscribing to its state.
 * Useful for warming the cache before navigating to /video or /watch.
 */
export function prefetchPlaylist(playlistId: string) {
  if (cache.has(playlistId)) return;
  const promise = fetch(
    `/api/playlist?playlistId=${encodeURIComponent(playlistId)}&max=100`,
  )
    .then(async (res) => {
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error ?? "Playlist fetch failed");
      }
      const items: PlaylistItem[] = data.items ?? [];
      cache.set(playlistId, { items, promise: null, error: null });
      return items;
    })
    .catch((e) => {
      cache.set(playlistId, {
        items: [],
        promise: null,
        error: e?.message ?? "fetch failed",
      });
      throw e;
    });
  cache.set(playlistId, { items: [], promise, error: null });
  return promise;
}
