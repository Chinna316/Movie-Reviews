const express = require('express');
const {
  getMovies,
  getMovieById,
  rejectMovieMutation,
} = require('../controllers/movie.controller');
const { upsertReview } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getMovies);
router.get('/:tmdbId', getMovieById);
router.post('/:tmdbId/reviews', protect, upsertReview);
router.post('/', protect, rejectMovieMutation);
router.patch('/:tmdbId', protect, rejectMovieMutation);
router.delete('/:tmdbId', protect, rejectMovieMutation);

module.exports = router;
