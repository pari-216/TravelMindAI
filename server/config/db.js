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
 * Helper that attempts a mongoose connection to the given URI.
 * Returns the connection promise.
 */
const tryConnect = (uri) => {
  return mongoose
    .connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then((conn) => {
      console.log(`MongoDB connected: ${sanitizeUri(uri)}`);
      return conn;
    })
    .catch((err) => {
      console.error(`MongoDB connection error (${sanitizeUri(uri)}): ${err.message}`);
      throw err;
    });
};

/**
 * Connect to MongoDB and cache the connection promise.
 *   - Reuses the same promise for concurrent requests.
 *   - Clears a rejected promise so later attempts can retry.
 *   - In production, a missing MONGODB_URI throws an explicit error.
 *   - In development, if the primary URI (if any) fails, we fall back to a local instance.
 */
const connectDB = async () => {
  // If already connected, return the existing connection.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt is already in progress, await it.
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

  // Determine primary URI (may be undefined).
  const primaryUri = process.env.MONGODB_URI;
  const isProd = process.env.NODE_ENV === "production";

  // Production must have a valid URI.
  if (isProd && !primaryUri) {
    const errMsg = "MONGODB_URI is required in production. Set it in Vercel environment variables.";
    console.error(errMsg);
    throw new Error(errMsg);
  }

  // Build a list of URIs to try in order.
  const urisToTry = [];
  if (primaryUri) {
    urisToTry.push(primaryUri);
  }
  if (!isProd) {
    // Development fallback to local MongoDB.
    urisToTry.push("mongodb://127.0.0.1:27017/travelmindai");
  }

  // Create a promise that tries each URI sequentially.
  const connectPromise = (async () => {
    for (const uri of urisToTry) {
      try {
        await tryConnect(uri);
        return; // success, stop trying further URIs.
      } catch (e) {
        // If this was the last URI, rethrow.
        if (uri === urisToTry[urisToTry.length - 1]) {
          throw e;
        }
        // Otherwise continue to next URI (fallback).
        console.warn(`Falling back to next MongoDB URI after failure of ${sanitizeUri(uri)}`);
      }
    }
  })();

  // Cache the promise.
  global.__mongooseConnectionPromise = connectPromise;

  try {
    await connectPromise;
    return mongoose.connection;
  } finally {
    // If the promise rejected, clear the cached promise so future calls can retry.
    connectPromise.catch(() => {
      global.__mongooseConnectionPromise = null;
    });
  }
};

// Connection event listeners for observability.
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

module.exports = connectDB;
