const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getCatalogPage, getMoviePayload } = require('../services/movie-catalog.service');

const getMovies = asyncHandler(async (req, res) => {
  const catalog = await getCatalogPage({
    page: req.query.page,
    query: req.query.query,
  });

  res.status(200).json({
    movies: catalog.movies,
    page: catalog.page,
    totalPages: catalog.totalPages,
    totalResults: catalog.totalResults,
  });
});

const getMovieById = asyncHandler(async (req, res) => {
  const movie = await getMoviePayload(req.params.tmdbId || req.params.id);

  res.status(200).json({
    movie,
  });
});

const rejectMovieMutation = asyncHandler(async () => {
  throw new AppError(
    'Movies come from TMDB now. Use the public catalog endpoints and store only user reviews in MongoDB.',
    405,
  );
});

module.exports = {
  getMovies,
  getMovieById,
  rejectMovieMutation,
};
