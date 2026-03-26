const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getMoviePayload } = require('../services/movie-catalog.service');
const { getMovieDetails, parseTmdbIdFromValue } = require('../services/tmdb.service');

const MAX_REVIEW_TITLE_LENGTH = 80;
const MAX_REVIEW_COMMENT_LENGTH = 2000;

function normalizeRating(value) {
  const rating = Number(value);

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new AppError('rating must be a number between 1 and 5.', 400);
  }

  return rating;
}

function normalizeTitle(value) {
  if (!value) {
    return '';
  }

  const normalizedValue = String(value).trim();

  if (normalizedValue.length > MAX_REVIEW_TITLE_LENGTH) {
    throw new AppError(
      `title must be ${MAX_REVIEW_TITLE_LENGTH} characters or fewer.`,
      400,
    );
  }

  return normalizedValue;
}

function normalizeComment(comment, body) {
  const value = comment ?? body;
  const normalizedValue = value ? String(value).trim() : '';

  if (normalizedValue.length > MAX_REVIEW_COMMENT_LENGTH) {
    throw new AppError(
      `comment must be ${MAX_REVIEW_COMMENT_LENGTH} characters or fewer.`,
      400,
    );
  }

  return normalizedValue;
}

function resolveTmdbId(req) {
  const body = req.body || {};

  return parseTmdbIdFromValue(
    req.params.tmdbId || req.params.movieId || body.tmdbId || body.movieId,
  );
}

const getMovieReviews = asyncHandler(async (req, res) => {
  const tmdbId = resolveTmdbId(req);

  const reviews = await Review.find({ tmdbId })
    .populate('user', 'name avatar role')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    reviews: reviews.map((review) => ({
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
            id: review.user._id.toString(),
            name: review.user.name,
            role: review.user.role,
            avatar: review.user.avatar || null,
          }
        : null,
    })),
  });
});

const upsertReview = asyncHandler(async (req, res) => {
  const tmdbId = resolveTmdbId(req);
  const { rating } = req.body;
  const normalizedComment = normalizeComment(req.body.comment, req.body.body);
  const title = normalizeTitle(req.body.title);

  if (!normalizedComment) {
    throw new AppError('tmdbId, rating, and comment are required.', 400);
  }

  const normalizedRating = normalizeRating(rating);
  const tmdbMovie = await getMovieDetails(tmdbId);

  const existingReview = await Review.findOne({
    tmdbId,
    user: req.user._id,
  });

  if (existingReview) {
    existingReview.title = title;
    existingReview.rating = normalizedRating;
    existingReview.comment = normalizedComment;
    await existingReview.save();

    await existingReview.populate('user', 'name avatar role');
    const movie = await getMoviePayload(tmdbId, { tmdbMovie });

    res.status(200).json({
      message: 'Review updated successfully.',
      review: {
        id: existingReview._id.toString(),
        tmdbId: existingReview.tmdbId,
        title: existingReview.title || '',
        body: existingReview.comment,
        comment: existingReview.comment,
        rating: existingReview.rating,
        createdAt: existingReview.createdAt,
        updatedAt: existingReview.updatedAt,
        user: {
          id: existingReview.user._id.toString(),
          name: existingReview.user.name,
          role: existingReview.user.role,
          avatar: existingReview.user.avatar || null,
        },
      },
      movie,
    });

    return;
  }

  const review = await Review.create({
    tmdbId,
    user: req.user._id,
    title,
    rating: normalizedRating,
    comment: normalizedComment,
  });

  await review.populate('user', 'name avatar role');
  const movie = await getMoviePayload(tmdbId, { tmdbMovie });

  res.status(201).json({
    message: 'Review created successfully.',
    review: {
      id: review._id.toString(),
      tmdbId: review.tmdbId,
      title: review.title || '',
      body: review.comment,
      comment: review.comment,
      rating: review.rating,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user._id.toString(),
        name: review.user.name,
        role: review.user.role,
        avatar: review.user.avatar || null,
      },
    },
    movie,
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new AppError('Review not found.', 404);
  }

  const isOwner = review.user.toString() === req.user._id.toString();

  if (!isOwner) {
    throw new AppError('You are not allowed to delete this review.', 403);
  }

  await review.deleteOne();

  res.status(200).json({
    message: 'Review deleted successfully.',
  });
});

module.exports = {
  getMovieReviews,
  upsertReview,
  deleteReview,
};
