const AppError = require('../utils/AppError');
const { buildImageUrl, getGenreMap, tmdbRequest } = require('../config/tmdb');

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function createMovieSlug(tmdbId, title) {
  const slug = slugify(title);
  return slug ? `${tmdbId}-${slug}` : String(tmdbId);
}

function parseTmdbIdFromValue(value) {
  const match = String(value || '').match(/^(\d+)/);

  if (!match) {
    throw new AppError('A valid TMDB movie id is required.', 400);
  }

  return Number(match[1]);
}

function buildImage(path, size) {
  const url = buildImageUrl(path, size);

  if (!url) {
    return null;
  }

  return {
    path,
    url,
  };
}

function getReleaseYear(releaseDate) {
  if (!releaseDate) {
    return 'TBD';
  }

  return releaseDate.slice(0, 4);
}

function mapMovieSummary(movie, genreMap, options = {}) {
  const poster = buildImage(movie.poster_path, 'w780');
  const backdrop = buildImage(movie.backdrop_path, 'w1280');

  return {
    id: String(movie.id),
    tmdbId: movie.id,
    slug: createMovieSlug(movie.id, movie.title),
    title: movie.title,
    synopsis: movie.overview || 'No synopsis available yet.',
    releaseDate: movie.release_date || null,
    releaseYear: getReleaseYear(movie.release_date),
    runtimeMinutes: '--',
    genres: (movie.genre_ids || [])
      .map((genreId) => genreMap.get(genreId))
      .filter(Boolean),
    poster,
    backdrop,
    backdrops: backdrop ? [backdrop] : [],
    trailerUrl: '',
    cast: [],
    featured: Boolean(options.featured),
    tmdbRating: Number(((movie.vote_average || 0) / 2).toFixed(1)),
    tmdbVoteCount: movie.vote_count || 0,
  };
}

function selectTrailer(videos) {
  const trailer =
    videos.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer' && video.official,
    ) ||
    videos.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ||
    videos.find((video) => video.site === 'YouTube');

  if (!trailer) {
    return '';
  }

  return `https://www.youtube.com/watch?v=${trailer.key}`;
}

function buildBackdropGallery(movie) {
  const gallery = (movie.images?.backdrops || [])
    .slice(0, 8)
    .map((image) => buildImage(image.file_path, 'w1280'))
    .filter(Boolean);

  if (!gallery.length) {
    const fallback = buildImage(movie.backdrop_path, 'w1280');
    return fallback ? [fallback] : [];
  }

  return gallery;
}

function mapMovieDetail(movie) {
  const poster = buildImage(movie.poster_path, 'w780');
  const backdrops = buildBackdropGallery(movie);

  return {
    id: String(movie.id),
    tmdbId: movie.id,
    slug: createMovieSlug(movie.id, movie.title),
    imdbId: movie.imdb_id || '',
    title: movie.title,
    synopsis: movie.overview || 'No synopsis available yet.',
    releaseDate: movie.release_date || null,
    releaseYear: getReleaseYear(movie.release_date),
    runtimeMinutes: movie.runtime || '--',
    genres: (movie.genres || []).map((genre) => genre.name),
    poster,
    backdrop: backdrops[0] || buildImage(movie.backdrop_path, 'w1280'),
    backdrops,
    trailerUrl: selectTrailer(movie.videos?.results || []),
    cast: (movie.credits?.cast || []).slice(0, 8).map((performer) => performer.name),
    featured: false,
    tmdbRating: Number(((movie.vote_average || 0) / 2).toFixed(1)),
    tmdbVoteCount: movie.vote_count || 0,
  };
}

async function getMoviesCatalog({ page = 1, query = '' } = {}) {
  const currentPage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const trimmedQuery = String(query || '').trim();
  const genreMap = await getGenreMap();

  const response = trimmedQuery
    ? await tmdbRequest('/search/movie', {
        include_adult: false,
        language: 'en-US',
        page: currentPage,
        query: trimmedQuery,
      })
    : await tmdbRequest('/movie/popular', {
        language: 'en-US',
        page: currentPage,
      });

  return {
    page: response.page || currentPage,
    totalPages: response.total_pages || 1,
    totalResults: response.total_results || 0,
    movies: (response.results || []).map((movie, index) =>
      mapMovieSummary(movie, genreMap, {
        featured: !trimmedQuery && index < 3,
      }),
    ),
  };
}

async function getMovieDetails(tmdbIdValue) {
  const tmdbId = parseTmdbIdFromValue(tmdbIdValue);
  const response = await tmdbRequest(`/movie/${tmdbId}`, {
    append_to_response: 'credits,videos,images',
    include_image_language: 'en,null',
    language: 'en-US',
  });

  return mapMovieDetail(response);
}

module.exports = {
  createMovieSlug,
  getMovieDetails,
  getMoviesCatalog,
  parseTmdbIdFromValue,
};
