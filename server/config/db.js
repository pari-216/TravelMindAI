const mongoose = require("mongoose");

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/travelmindai";
  const fallbackUri = "mongodb://127.0.0.1:27017/travelmindai";

  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Primary MongoDB connection error (${primaryUri}): ${error.message}`);
    if (primaryUri !== fallbackUri) {
      console.log(`Attempting fallback connection to local MongoDB (${fallbackUri})...`);
      try {
        const conn = await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`Fallback MongoDB connected: ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`Fallback MongoDB connection error: ${fallbackError.message}`);
      }
    }
  }
};

module.exports = connectDB;
