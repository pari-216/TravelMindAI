// server/config/db.js

// Mongoose connection handling for both local development and Vercel serverless production.
// Production requires a valid MONGODB_URI (MongoDB Atlas). No localhost fallback is allowed in production.
// In development (NODE_ENV !== "production") a local MongoDB fallback is permitted.

const mongoose = require("mongoose");

/**
 * Returns a sanitized version of the MongoDB URI for safe logging.
 */
const sanitizeUri = (uri) => {
  if (!uri) return "";
  // Mask credentials in the URI
  return uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
};

/**
 * Connect to MongoDB and cache the connection promise.
 *   - Reuses the same promise for concurrent requests.
 *   - Clears a rejected promise so later attempts can retry.
 *   - Works with Vercel's warm serverless containers by caching the resolved connection.
 */
const connectDB = async () => {
  // If already connected, return the existing connection.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt is in progress, await it.
  if (global.__mongooseConnectionPromise) {
    try {
      await global.__mongooseConnectionPromise;
      return mongoose.connection;
    } catch (e) {
      // Previous attempt failed – clear the promise so we can retry.
      global.__mongooseConnectionPromise = null;
      throw e;
    }
  }

  // Determine the MongoDB URI.
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV !== "production") {
      uri = "mongodb://127.0.0.1:27017/travelmindai";
      console.warn(
        "MONGODB_URI not set – falling back to local MongoDB for development."
      );
    } else {
      const errMsg =
        "MONGODB_URI is required in production. Set it in Vercel environment variables.";
      console.error(errMsg);
      throw new Error(errMsg);
    }
  }

  // Create a promise for the connection attempt and cache it.
  global.__mongooseConnectionPromise = mongoose
    .connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then((conn) => {
      console.log(`MongoDB connected: ${sanitizeUri(uri)}`);
      return conn;
    })
    .catch((err) => {
      console.error(`MongoDB connection error: ${err.message}`);
      // Clear the cached promise so future calls can retry.
      global.__mongooseConnectionPromise = null;
      throw err;
    });

  // Await the connection (or failure) and return the connection object.
  await global.__mongooseConnectionPromise;
  return mongoose.connection;
};

// Connection event listeners for observability.
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

module.exports = connectDB;
