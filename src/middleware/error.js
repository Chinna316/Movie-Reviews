const env = require('../config/env');

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong.';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((value) => value.message)
      .join(' ');
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = `A record with that ${Object.keys(error.keyValue).join(', ')} already exists.`;
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier.';
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired.';
  }

  res.status(statusCode).json({
    message,
    ...(env.nodeEnv !== 'production' && {
      stack: error.stack,
    }),
  });
}

module.exports = errorHandler;
