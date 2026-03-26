# Movie Reviews API

Backend-only API for a movie review app built with:

- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT auth + bcrypt
- TMDB for movie catalog data
- Vercel deployment

This repo is meant to power a separate React + Vite frontend. Movies are fetched live from TMDB, while MongoDB stores only app-owned data such as users and reviews.

## What Lives Where

- TMDB:
  movie search, movie details, posters, backdrops, trailers, cast
- MongoDB:
  users, JWT auth data, user reviews tied to TMDB movie IDs

This avoids copying a huge movie catalog into MongoDB.

## Environment Variables

For local development, copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

Required:

- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `TMDB_READ_ACCESS_TOKEN` or `TMDB_API_KEY`

`.env` is for your local machine only and should not be committed. This repo already ignores `.env` in [.gitignore](/Users/chinnaannepu/Movie-Reviews/.gitignore).

## Local Development

```bash
npm install
npm run dev
```

Default local API URL:

```text
http://localhost:5000
```

## Main Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/movies`
- `GET /api/movies?query=interstellar&page=1`
- `GET /api/movies/:tmdbIdOrSlug`
- `POST /api/movies/:tmdbId/reviews`
- `GET /api/reviews/movie/:tmdbId`
- `POST /api/reviews`
- `DELETE /api/reviews/:id`

## Response Shape Notes

Movie list/detail responses are shaped to be frontend-friendly and include fields like:

- `id`
- `tmdbId`
- `slug`
- `title`
- `synopsis`
- `releaseYear`
- `runtimeMinutes`
- `genres`
- `poster`
- `backdrop`
- `trailerUrl`
- `cast`
- `averageRating`
- `reviewCount`

If a movie has no local reviews yet, `averageRating` falls back to the TMDB score scaled to 5.

## Review Payload

`POST /api/reviews` or `POST /api/movies/:tmdbId/reviews`

```json
{
  "tmdbId": 603,
  "title": "Still hits hard",
  "rating": 5,
  "comment": "The atmosphere, action, and pacing still work incredibly well."
}
```

The API also accepts `movieId` instead of `tmdbId`, and `body` instead of `comment`, to make frontend migration easier.

## Frontend Integration Notes

- Send the JWT as `Authorization: Bearer <token>`.
- Point your frontend to this backend with `VITE_API_BASE_URL`.
- If you use local Vite dev, make sure backend `CORS_ORIGIN` includes both:
  `http://localhost:5173,http://127.0.0.1:5173`
- Movie creation/upload flows are no longer part of the backend because the catalog now comes from TMDB.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. In Vercel Project Settings, add the same env var names from [.env.example](/Users/chinnaannepu/Movie-Reviews/.env.example):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `CORS_ORIGIN`
   - `TMDB_READ_ACCESS_TOKEN` or `TMDB_API_KEY`
4. Redeploy whenever you change an env var value.
5. Deploy.

Notes:

- Do not commit a real `.env` file to GitHub.
- If a secret was ever committed or shared accidentally, rotate it before deploying.
- The backend now fails fast when required env vars are missing or when `JWT_SECRET` is too short.

The serverless entrypoint is [api/index.js](/Users/chinnaannepu/Movie-Reviews/api/index.js), which wraps the Express app for Vercel.
