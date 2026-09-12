export interface Episode {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  youtubeId: string;
  airDate: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  episodes: Episode[];
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
  logo?: string;
  year: number;
  rating: string;
  duration: string;
  genres: string[];
  description: string;
  playlistId: string;
  /**
   * YouTube Data API playlist ID, e.g. "PLxx123".
   * The /api/playlist route fetches real episode videos from this ID.
   */
  youtubePlaylistId?: string;
  featured?: boolean;
}

export interface MovieCategory {
  id: string;
  title: string;
  movies: Movie[];
}
