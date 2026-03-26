const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name) {
  const value = String(process.env[name] || '').trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function parseAllowedOrigins(value) {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const jwtSecret = requireEnv('JWT_SECRET');

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

const allowedOrigins = parseAllowedOrigins(requireEnv('CORS_ORIGIN'));

if (!allowedOrigins.length) {
  throw new Error('CORS_ORIGIN must include at least one origin.');
}

const tmdbReadAccessToken = String(
  process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_READ_ACCESS_TOKEN || '',
).trim();
const tmdbApiKey = String(process.env.TMDB_API_KEY || '').trim();

if (!tmdbReadAccessToken && !tmdbApiKey) {
  throw new Error('TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY is not configured.');
}

module.exports = {
  allowedOrigins,
  jwtExpiresIn: String(process.env.JWT_EXPIRES_IN || '7d').trim() || '7d',
  jwtSecret,
  mongodbUri: requireEnv('MONGODB_URI'),
  nodeEnv: String(process.env.NODE_ENV || 'development').trim() || 'development',
  port: Number(process.env.PORT) || 5000,
  tmdbApiKey,
  tmdbReadAccessToken,
};
