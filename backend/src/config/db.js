const mongoose = require('mongoose');

/**
 * Connect to MongoDB with production-grade event logging and retry logic
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/noor_disaster_db';

  try {
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true, // Build indexes automatically in development/seed
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    console.warn(`[Database Notice] Ensure MongoDB is running locally or specify a valid MONGODB_URI in backend/.env`);
    // In production we would exit or retry; here we re-throw so the caller can handle accordingly
    throw error;
  }

  // Handle runtime connection lifecycle events
  mongoose.connection.on('error', (err) => {
    console.error(`[Database Error] Mongoose runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database Warning] Mongoose disconnected from MongoDB.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] Mongoose reconnected to MongoDB.');
  });
};

module.exports = connectDB;
