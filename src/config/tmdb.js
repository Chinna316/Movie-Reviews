const AppError = require('../utils/AppError');
const env = require('./env');

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

let genreCache = {
  data: null,
  expiresAt: 0,
};

function looksLikeApiKey(value) {
  return /^[a-f0-9]{32}$/i.test(String(value || '').trim());
}

function getTmdbCredentials() {
  const readAccessToken = env.tmdbReadAccessToken;
  const apiKey = env.tmdbApiKey;

  if (readAccessToken) {
    if (looksLikeApiKey(readAccessToken)) {
      return {
        apiKey: readAccessToken,
        mode: 'api_key',
      };
    }

    return {
      token: readAccessToken,
      mode: 'bearer',
    };
  }

  if (apiKey) {
    return {
      apiKey,
      mode: 'api_key',
    };
  }

  throw new AppError(
    'TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY is not configured.',
    500,
  );
}

async function tmdbRequest(path, searchParams = {}) {
  const url = new URL(`${TMDB_API_BASE}${path}`);
  const credentials = getTmdbCredentials();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = {
    Accept: 'application/json',
  };

  if (credentials.mode === 'bearer') {
    headers.Authorization = `Bearer ${credentials.token}`;
  }

  if (credentials.mode === 'api_key') {
    url.searchParams.set('api_key', credentials.apiKey);
  }

  const response = await fetch(url, {
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 404) {
      throw new AppError(data.status_message || 'TMDB resource not found.', 404);
    }

    throw new AppError(
      data.status_message || 'TMDB request failed.',
      response.status >= 400 && response.status < 500 ? 400 : 502,
    );
  }

  return data;
}

function buildImageUrl(path, size = 'w780') {
  if (!path) {
    return null;
  }

  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

async function getGenreMap() {
  if (genreCache.data && genreCache.expiresAt > Date.now()) {
    return genreCache.data;
  }

  const response = await tmdbRequest('/genre/movie/list', {
    language: 'en-US',
  });

  genreCache = {
    data: new Map((response.genres || []).map((genre) => [genre.id, genre.name])),
    expiresAt: Date.now() + 6 * 60 * 60 * 1000,
  };

  return genreCache.data;
}

module.exports = {
  buildImageUrl,
  getGenreMap,
  looksLikeApiKey,
  tmdbRequest,
};
