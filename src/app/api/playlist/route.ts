import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface PlaylistItem {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  position: number;
  publishedAt: string;
  channelTitle: string;
}

interface RawPlaylistItem {
  snippet?: {
    title?: string;
    description?: string;
    position?: number;
    publishedAt?: string;
    channelTitle?: string;
    resourceId?: {
      kind?: string;
      videoId?: string;
    };
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
      maxres?: { url: string };
      standard?: { url: string };
    };
  };
  contentDetails?: {
    videoId?: string;
    videoPublishedAt?: string;
  };
}

/**
 * Fetch the videos inside a YouTube playlist using the official
 * YouTube Data API v3. Requires `YOUTUBE_DATA_API_KEY` env var.
 *
 * Endpoint: GET /api/playlist?playlistId=PLxxx&max=50
 *
 * Returns:
 *   { ok, count, items: [{ videoId, title, description, thumbnail, position, publishedAt, channelTitle }] }
 *
 * If the env var is not set, returns a clear 500 error explaining the problem.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const playlistId = url.searchParams.get("playlistId");
  const max = Math.min(
    200,
    parseInt(url.searchParams.get("max") ?? "50", 10) || 50,
  );

  if (!playlistId) {
    return NextResponse.json(
      { ok: false, error: "Missing playlistId query param" },
      { status: 400 },
    );
  }

  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "YOUTUBE_DATA_API_KEY environment variable is not set. " +
          "Add it in Vercel → Project Settings → Environment Variables.",
      },
      { status: 500 },
    );
  }

  try {
    // YouTube Data API paginates playlist items 50 at a time.
    const items: PlaylistItem[] = [];
    let pageToken: string | undefined = undefined;
    let fetchedPages = 0;
    const maxPages = Math.ceil(max / 50);

    while (fetchedPages < maxPages) {
      const apiUrl = new URL(
        "https://www.googleapis.com/youtube/v3/playlistItems",
      );
      apiUrl.searchParams.set("part", "snippet,contentDetails");
      apiUrl.searchParams.set("playlistId", playlistId);
      apiUrl.searchParams.set("maxResults", "50");
      apiUrl.searchParams.set("key", apiKey);
      if (pageToken) apiUrl.searchParams.set("pageToken", pageToken);

      const res = await fetch(apiUrl.toString(), { cache: "no-store" });

      if (!res.ok) {
        let errMsg = `YouTube Data API returned ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody?.error?.message) errMsg = errBody.error.message;
        } catch {
          /* ignore */
        }
        return NextResponse.json(
          { ok: false, error: errMsg, playlistId },
          { status: res.status },
        );
      }

      const data = await res.json();
      const rawItems: RawPlaylistItem[] = data?.items ?? [];
      for (const it of rawItems) {
        const videoId =
          it.snippet?.resourceId?.videoId ?? it.contentDetails?.videoId;
        if (!videoId) continue;

        const thumbs = it.snippet?.thumbnails ?? {};
        const thumb =
          thumbs.maxres?.url ??
          thumbs.standard?.url ??
          thumbs.high?.url ??
          thumbs.medium?.url ??
          thumbs.default?.url ??
          "";

        const title = it.snippet?.title ?? "(untitled)";
        // Skip private/deleted videos whose title starts with "Private" or "Deleted"
        if (/^private/i.test(title) || /^deleted/i.test(title)) continue;

        items.push({
          videoId,
          title: title.replace(/\s*\|\s*.*$/, "").trim(), // strip channel suffix
          description: (it.snippet?.description ?? "").trim(),
          thumbnail: thumb,
          position:
            it.snippet?.position ?? items.length + 0,
          publishedAt:
            it.contentDetails?.videoPublishedAt ??
            it.snippet?.publishedAt ??
            "",
          channelTitle: it.snippet?.channelTitle ?? "",
        });

        if (items.length >= max) break;
      }

      pageToken = data?.nextPageToken;
      fetchedPages += 1;
      if (!pageToken) break;
      if (items.length >= max) break;
    }

    return NextResponse.json({
      ok: true,
      count: items.length,
      playlistId,
      items,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown playlist fetch error" },
      { status: 500 },
    );
  }
}
