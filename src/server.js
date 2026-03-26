const app = require('./index');
const connectToDatabase = require('./config/db');
const env = require('./config/env');

async function startServer() {
  try {
    await connectToDatabase();

    app.listen(env.port, () => {
      console.log(`Movie Reviews API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server');
    console.error(error);
    process.exit(1);
  }
}

startServer();
