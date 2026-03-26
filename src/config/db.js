const mongoose = require('mongoose');
const env = require('./env');

let hasLoggedConnection = false;

if (!global.mongooseCache) {
  global.mongooseCache = {
    conn: null,
    promise: null,
  };
}

async function connectToDatabase() {
  if (global.mongooseCache.conn) {
    return global.mongooseCache.conn;
  }

  if (!global.mongooseCache.promise) {
    mongoose.set('strictQuery', true);

    global.mongooseCache.promise = mongoose
      .connect(env.mongodbUri, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    global.mongooseCache.conn = await global.mongooseCache.promise;
  } catch (error) {
    global.mongooseCache.promise = null;
    throw error;
  }

  if (!hasLoggedConnection && env.nodeEnv !== 'test') {
    console.log('MongoDB connected');
    hasLoggedConnection = true;
  }

  return global.mongooseCache.conn;
}

module.exports = connectToDatabase;
