import { Movie, MovieCategory, Playlist } from "./types";

// Common YouTube IDs that are reliably available
const YT = {
  bigBuck: "aqz-KE-bpKQ",
  sintel: "eRsGyueVLvQ",
  tearsOfSteel: "R6MlUcmOul8",
  elephantDream: "TLkA0RELQ1g",
  spring: "WhWc3b3KhnY",
  // Additional sample IDs
  sample1: "LXb3EKWsInQ",
  sample2: "fNqkXKKWBgs",
  sample3: "M7lc1UVf-VE",
};

// Helper to build episode list for a movie
function makeEpisodes(prefix: string, movieTitle: string, count: number, baseThumbs: string[]): any[] {
  const ytIds = [YT.bigBuck, YT.sintel, YT.tearsOfSteel, YT.elephantDream, YT.spring, YT.sample1, YT.sample2, YT.sample3];
  return Array.from({ length: count }, (_, i) => {
    const num = i + 1;
    const season = Math.floor(num / 4) + 1;
    const episodeInSeason = (num % 4) || 4;
    return {
      id: `${prefix}-ep-${num}`,
      episodeNumber: episodeInSeason,
      seasonNumber: season,
      title: `${movieTitle} — Chapter ${num}`,
      description: `Chapter ${num} of ${movieTitle}. A gripping continuation of the saga with twists, revelations and cinematic moments that redefine the journey of the lead characters.`,
      duration: `${48 + (num % 12)}m`,
      thumbnail: baseThumbs[i % baseThumbs.length],
      youtubeId: ytIds[i % ytIds.length],
      airDate: `2024-${String((i % 12) + 1).padStart(2, "0")}-15`,
    };
  });
}

const posterPool = [
  "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop",
];

const backdropPool = [
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1920&auto=format&fit=crop",
];

const thumbPool = [
  "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop",
];

const rawMovies: Array<Omit<Movie, "playlistId"> & { episodes: number }> = [
  {
    id: "midnight-protocol",
    title: "Midnight Protocol",
    poster: posterPool[0],
    backdrop: backdropPool[0],
    year: 2024,
    rating: "TV-MA",
    duration: "1h 58m",
    genres: ["Thriller", "Crime", "Drama"],
    description:
      "A gifted hacker is pulled into a conspiracy that reaches the highest levels of global intelligence. As the threads unravel, she must decide who to trust — and how much of herself she is willing to sacrifice to expose the truth.",
    featured: true,
    episodes: 8,
  },
  {
    id: "shadow-empire",
    title: "Shadow Empire",
    poster: posterPool[1],
    backdrop: backdropPool[1],
    year: 2023,
    rating: "TV-14",
    duration: "2h 12m",
    genres: ["Action", "Adventure"],
    description:
      "In a fractured kingdom on the edge of war, a reluctant heir must rally unlikely allies to reclaim a throne she never wanted. Blood, steel, and political intrigue collide in this sweeping epic.",
    episodes: 10,
  },
  {
    id: "neon-requiem",
    title: "Neon Requiem",
    poster: posterPool[2],
    backdrop: backdropPool[2],
    year: 2024,
    rating: "TV-MA",
    duration: "1h 47m",
    genres: ["Sci-Fi", "Cyberpunk"],
    description:
      "In a megacity where memories can be bought, sold, and erased, a rogue detective hunts a serial killer who steals the final memories of the dying. Every clue pulls her closer to a truth she may not survive.",
    episodes: 8,
  },
  {
    id: "the-last-cartographer",
    title: "The Last Cartographer",
    poster: posterPool[3],
    backdrop: backdropPool[3],
    year: 2022,
    rating: "TV-PG",
    duration: "1h 36m",
    genres: ["Adventure", "Drama"],
    description:
      "An aging mapmaker embarks on one final expedition to chart an island that does not appear on any map. What he finds there will rewrite the boundaries of the known world — and his understanding of home.",
    episodes: 6,
  },
  {
    id: "crimson-tide-rising",
    title: "Crimson Tide Rising",
    poster: posterPool[4],
    backdrop: backdropPool[4],
    year: 2023,
    rating: "TV-MA",
    duration: "2h 04m",
    genres: ["War", "Drama"],
    description:
      "A naval crew must navigate a fragile chain of command when an encrypted order puts them at odds with their own government. Honor and survival clash beneath the waves.",
    episodes: 8,
  },
  {
    id: "echoes-of-tomorrow",
    title: "Echoes of Tomorrow",
    poster: posterPool[5],
    backdrop: backdropPool[5],
    year: 2024,
    rating: "TV-14",
    duration: "1h 52m",
    genres: ["Sci-Fi", "Drama"],
    description:
      "When a physicist receives messages from her future self, she races to prevent a catastrophe she has not yet caused. Time bends, choices multiply, and the cost of being right grows with every minute.",
    episodes: 10,
  },
  {
    id: "velvet-thunder",
    title: "Velvet Thunder",
    poster: posterPool[6],
    backdrop: backdropPool[0],
    year: 2024,
    rating: "TV-MA",
    duration: "1h 41m",
    genres: ["Music", "Drama"],
    description:
      "A jazz prodigy rises through the smoky clubs of a city that never sleeps, only to discover that her talent was built on a lie. To find her own voice, she must burn down everything she has become.",
    episodes: 6,
  },
  {
    id: "the-frost-king",
    title: "The Frost King",
    poster: posterPool[7],
    backdrop: backdropPool[1],
    year: 2023,
    rating: "TV-14",
    duration: "2h 18m",
    genres: ["Fantasy", "Adventure"],
    description:
      "In a kingdom locked in eternal winter, a young warrior seeks the legendary flame that can melt the frozen throne. But the deeper she travels, the more she learns that the cold was never the enemy.",
    episodes: 8,
  },
  {
    id: "paper-lions",
    title: "Paper Lions",
    poster: posterPool[8],
    backdrop: backdropPool[2],
    year: 2022,
    rating: "TV-PG",
    duration: "1h 33m",
    genres: ["Drama", "Family"],
    description:
      "Two estranged siblings reunite to save their grandfather's printing press — and rediscover the language of family that was never fully lost between them.",
    episodes: 6,
  },
  {
    id: "silent-horizon",
    title: "Silent Horizon",
    poster: posterPool[9],
    backdrop: backdropPool[3],
    year: 2024,
    rating: "TV-MA",
    duration: "1h 59m",
    genres: ["Mystery", "Thriller"],
    description:
      "When a small coastal town wakes to find the ocean has vanished overnight, a lighthouse keeper and a marine biologist must uncover what — or who — silenced the sea.",
    episodes: 8,
  },
  {
    id: "the-glasshouse",
    title: "The Glasshouse",
    poster: posterPool[0],
    backdrop: backdropPool[4],
    year: 2023,
    rating: "TV-MA",
    duration: "1h 44m",
    genres: ["Psychological", "Thriller"],
    description:
      "A renowned botanist invites five strangers into her glass sanctuary, where every wall watches and every bloom remembers. Only one will leave — and only one will remember why.",
    episodes: 6,
  },
  {
    id: "ironwood",
    title: "Ironwood",
    poster: posterPool[1],
    backdrop: backdropPool[5],
    year: 2022,
    rating: "TV-14",
    duration: "1h 51m",
    genres: ["Western", "Drama"],
    description:
      "A retired marshal returns to a frontier town he once swore never to see again, drawn by a debt that has waited twenty years to be paid in lead.",
    episodes: 8,
  },
];

// Build full movies + playlists
export const MOVIES: Movie[] = rawMovies.map((rm, idx) => ({
  id: rm.id,
  title: rm.title,
  poster: rm.poster,
  backdrop: rm.backdrop,
  year: rm.year,
  rating: rm.rating,
  duration: rm.duration,
  genres: rm.genres,
  description: rm.description,
  playlistId: `pl-${rm.id}`,
  featured: rm.featured,
}));

export const PLAYLISTS: Playlist[] = rawMovies.map((rm) => ({
  id: `pl-${rm.id}`,
  title: `${rm.title} — Season 1`,
  description: `All ${rm.episodes} chapters of ${rm.title}.`,
  episodes: makeEpisodes(rm.id, rm.title, rm.episodes, thumbPool),
}));

// Build categories
export const CATEGORIES: MovieCategory[] = [
  {
    id: "trending",
    title: "Trending Now",
    movies: [MOVIES[0], MOVIES[2], MOVIES[5], MOVIES[9], MOVIES[7], MOVIES[3], MOVIES[10], MOVIES[1]],
  },
  {
    id: "originals",
    title: "Goothiah TV Originals",
    movies: [MOVIES[1], MOVIES[4], MOVIES[7], MOVIES[11], MOVIES[0], MOVIES[8]],
  },
  {
    id: "thriller",
    title: "Thrillers to Keep You Up",
    movies: [MOVIES[0], MOVIES[9], MOVIES[10], MOVIES[4], MOVIES[5]],
  },
  {
    id: "scifi",
    title: "Sci-Fi & Beyond",
    movies: [MOVIES[2], MOVIES[5], MOVIES[3], MOVIES[9]],
  },
  {
    id: "drama",
    title: "Award-Winning Dramas",
    movies: [MOVIES[6], MOVIES[8], MOVIES[11], MOVIES[3], MOVIES[7]],
  },
  {
    id: "fantasy",
    title: "Fantasy Worlds",
    movies: [MOVIES[7], MOVIES[3], MOVIES[1], MOVIES[10]],
  },
];

// Lookup helpers
export function getMovieById(id: string | null | undefined): Movie | undefined {
  if (!id) return undefined;
  return MOVIES.find((m) => m.id === id);
}

export function getPlaylistByMovieId(movieId: string | null | undefined): Playlist | undefined {
  const movie = getMovieById(movieId);
  if (!movie) return undefined;
  return PLAYLISTS.find((p) => p.id === movie.playlistId);
}

export function getEpisodeById(movieId: string | null | undefined, episodeId: string | null | undefined) {
  const playlist = getPlaylistByMovieId(movieId);
  if (!playlist) return undefined;
  return playlist.episodes.find((e) => e.id === episodeId);
}

export function getFeaturedMovie(): Movie {
  return MOVIES.find((m) => m.featured) ?? MOVIES[0];
}
