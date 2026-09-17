const mongoose = require('mongoose');

/**
 * Connect to MongoDB database.
 * In a real production setup, connection retries and pooled connections
 * ensure high availability during network hiccups.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/soundwave');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database Warning] MongoDB connection failed (${error.message}). Running in mock/offline mode for routes.`);
  }
};

module.exports = connectDB;
