const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Connect to MongoDB with retry logic.
 * @param {string} [uri] - MongoDB connection URI. Defaults to MONGODB_URI env var.
 * @returns {Promise<typeof mongoose>}
 */
async function connectDatabase(uri) {
  const connectionString = uri || process.env.MONGODB_URI;

  if (!connectionString) {
    console.error('MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  mongoose.connection.on('connecting', () => {
    console.log('MongoDB: attempting connection...');
  });

  mongoose.connection.on('connected', () => {
    console.log('MongoDB: connected successfully.');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB: connection disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB: connection re-established.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err.message}`, { stack: err.stack });
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(connectionString, {
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        w: 'majority',
      });

      console.log(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);

      if (attempt === MAX_RETRIES) {
        console.error('MongoDB: all connection attempts exhausted. Exiting.');
        process.exit(1);
      }

      const delay = RETRY_DELAY_MS * attempt;
      console.log(`MongoDB: retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Close the database connection gracefully.
 */
async function disconnectDatabase() {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed gracefully.');
  } catch (err) {
    console.error(`MongoDB disconnection error: ${err.message}`);
  }
}

// Process-level graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

module.exports = { connectDatabase, disconnectDatabase };
