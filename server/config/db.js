const mongoose = require("mongoose");

let isConnecting = false;

const sanitizeUri = (uri) => {
  if (!uri) return "";
  return uri.replace(/\/\/[^:]+:([^@]+)@/, "//***:***@");
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;
  const primaryUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/travelmindai";
  const fallbackUri = "mongodb://127.0.0.1:27017/travelmindai";

  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    isConnecting = false;
    console.error(`Primary MongoDB connection error: ${error.message}`);
    if (primaryUri !== fallbackUri) {
      console.log("Attempting fallback connection to local MongoDB...");
      try {
        isConnecting = true;
        const conn = await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`Fallback MongoDB connected: ${conn.connection.host}`);
        isConnecting = false;
        return;
      } catch (fallbackError) {
        isConnecting = false;
        console.error(`Fallback MongoDB connection error: ${fallbackError.message}`);
      }
    }
  }
};

// Listen to connection events
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

// Periodic reconnect attempt if database is offline (e.g. paused Atlas cluster resumed)
setInterval(() => {
  if (mongoose.connection.readyState !== 1 && !isConnecting) {
    connectDB().catch(() => {});
  }
}, 15000);

module.exports = connectDB;
