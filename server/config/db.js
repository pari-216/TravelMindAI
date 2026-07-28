const mongoose = require("mongoose");

const connectDB = async () => {
  const RETRY_INTERVAL_MS = 5000;

  const attempt = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`MongoDB connection error: ${error.message}`);
      console.log(`Retrying MongoDB connection in ${RETRY_INTERVAL_MS / 1000}s...`);
      setTimeout(attempt, RETRY_INTERVAL_MS);
    }
  };

  await attempt();
};

module.exports = connectDB;
