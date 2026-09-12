import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    // Allow remote images from all hosts used by the show posters.
    remotePatterns: [
      { protocol: "https", hostname: "wad.nyc3.digitaloceanspaces.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "external-content.duckduckgo.com" },
      { protocol: "https", hostname: "fr.web.img4.acsta.net" },
      { protocol: "https", hostname: "fr.web.img5.acsta.net" },
      { protocol: "https", hostname: "i.ebayimg.com" },
      { protocol: "https", hostname: "i.redd.it" },
      { protocol: "https", hostname: "preview.redd.it" },
      { protocol: "https", hostname: "images.justwatch.com" },
      { protocol: "https", hostname: "licensing.biz" },
      { protocol: "https", hostname: "mir-s3-cdn-cf.behance.net" },
      { protocol: "https", hostname: "ninjagoizlesene.com.tr" },
      { protocol: "https", hostname: "occ-0-753-1007.1.nflxso.net" },
      { protocol: "https", hostname: "play-lh.googleusercontent.com" },
      { protocol: "https", hostname: "resizing.flixster.com" },
      { protocol: "https", hostname: "static.filmvandaag.nl" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "www.tvtime.com" },
    ],
  },
};

export default nextConfig;
