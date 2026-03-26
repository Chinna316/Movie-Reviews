const express = require('express');
const {
  getMovieReviews,
  upsertReview,
  deleteReview,
} = require('../controllers/review.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/movie/:movieId', getMovieReviews);
router.post('/', protect, upsertReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
