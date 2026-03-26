const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80,
    },
    rating: {
      type: Number,
      required: [true, 'A rating is required.'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'A review comment is required.'],
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index(
  {
    tmdbId: 1,
    user: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
