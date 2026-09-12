// Re-export the new show-based catalog as the main data source.
// The old demo "movie" catalog has been replaced by the user-supplied
// show list in ./shows-data.ts (68 shows).
export {
  SHOW_MOVIES as MOVIES,
  SHOW_PLAYLISTS as PLAYLISTS,
  SHOW_CATEGORIES as CATEGORIES,
  getShowMovieById as getMovieById,
  getShowPlaylistByMovieId as getPlaylistByMovieId,
  getShowEpisodeById as getEpisodeById,
  getFeaturedShow as getFeaturedMovie,
} from "./shows-data";

// Also export the SHOW_-prefixed names directly for callers that use them.
export {
  SHOW_MOVIES,
  SHOW_PLAYLISTS,
  SHOW_CATEGORIES,
  getShowMovieById,
  getShowPlaylistByMovieId,
  getShowEpisodeById,
  getFeaturedShow,
} from "./shows-data";
