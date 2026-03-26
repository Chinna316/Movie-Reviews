const Review = require('../models/Review');
const { getMovieDetails, getMoviesCatalog, parseTmdbIdFromValue } = require('./tmdb.service');

function roundToSingleDecimal(value) {
  return Number(Number(value || 0).toFixed(1));
}

function formatReviewDocument(review) {
  return {
    id: review._id.toString(),
    tmdbId: review.tmdbId,
    title: review.title || '',
    body: review.comment,
    comment: review.comment,
    rating: review.rating,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user
      ? {
          id: review.user._id ? review.user._id.toString() : review.user.id,
          name: review.user.name,
          role: review.user.role,
          avatar: review.user.avatar || null,
        }
      : null,
  };
}

function formatStats(stats, tmdbRating) {
  const reviewCount = stats?.reviewCount || 0;
  const localAverageRating = stats ? roundToSingleDecimal(stats.averageRating) : 0;
  const averageRating = reviewCount ? localAverageRating : roundToSingleDecimal(tmdbRating);

  return {
    averageRating,
    localAverageRating,
    reviewCount,
  };
}

async function buildReviewStats(tmdbIds) {
  if (!tmdbIds.length) {
    return new Map();
  }

  const stats = await Review.aggregate([
    {
      $match: {
        tmdbId: {
          $in: tmdbIds,
        },
      },
    },
    {
      $group: {
        _id: '$tmdbId',
        averageRating: {
          $avg: '$rating',
        },
        reviewCount: {
          $sum: 1,
        },
      },
    },
  ]);

  return new Map(stats.map((entry) => [String(entry._id), entry]));
}

async function getCatalogPage(params) {
  const catalog = await getMoviesCatalog(params);
  const statsMap = await buildReviewStats(catalog.movies.map((movie) => movie.tmdbId));

  return {
    ...catalog,
    movies: catalog.movies.map((movie) => ({
      ...movie,
      ...formatStats(statsMap.get(String(movie.tmdbId)), movie.tmdbRating),
    })),
  };
}

async function getMoviePayload(tmdbIdValue, options = {}) {
  const tmdbId = parseTmdbIdFromValue(tmdbIdValue);
  const tmdbMovie = options.tmdbMovie || (await getMovieDetails(tmdbId));

  const [reviews, statsMap] = await Promise.all([
    Review.find({ tmdbId })
      .populate('user', 'name avatar role')
      .sort({ createdAt: -1 })
      .lean(),
    buildReviewStats([tmdbId]),
  ]);

  return {
    ...tmdbMovie,
    ...formatStats(statsMap.get(String(tmdbId)), tmdbMovie.tmdbRating),
    reviews: reviews.map((review) => formatReviewDocument(review)),
  };
}

module.exports = {
  formatReviewDocument,
  getCatalogPage,
  getMoviePayload,
};
