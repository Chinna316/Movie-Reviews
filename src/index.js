const express = require('express');
const cors = require('cors');
const connectToDatabase = require('./config/db');
const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const movieRoutes = require('./routes/movie.routes');
const reviewRoutes = require('./routes/review.routes');
const AppError = require('./utils/AppError');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/error');

const app = express();
const databaseBackedPaths = [
  '/api/auth',
  '/auth',
  '/api/movies',
  '/movies',
  '/api/reviews',
  '/reviews',
];

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError(`Origin ${origin} is not allowed by CORS.`, 403));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Movie Reviews API',
    status: 'ok',
    routes: {
      health: '/api/health',
      auth: '/api/auth',
      movies: '/api/movies',
      reviews: '/api/reviews',
    },
  });
});

app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    mode: 'live',
    catalogSource: 'TMDB',
    authStore: 'MongoDB Atlas',
    timestamp: new Date().toISOString(),
  });
});

app.use(databaseBackedPaths, async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/movies', '/movies'], movieRoutes);
app.use(['/api/reviews', '/reviews'], reviewRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
