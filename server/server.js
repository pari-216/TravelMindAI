const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

// Load environment variables (supports running from any working directory)
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config(); // Fallback for root .env if present

// Connect to MongoDB (non-blocking — Vercel serverless safe)
connectDB().catch((err) => console.error("MongoDB initial connection error:", err.message));

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map(o => o.trim());
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isLocalhost || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Health check route
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({ status: "ok", database: dbStatus });
});

// Auth routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/trips", require("./routes/tripRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/packing", require("./routes/packingRoutes"));
app.use("/api/journal", require("./routes/journalRoutes"));
app.use("/api/reminders", require("./routes/reminderRoutes"));
app.use("/api/hotels", require("./routes/hotelRoutes"));
app.use("/api/weather", require("./routes/weatherRoutes"));
app.use("/api/currency", require("./routes/currencyRoutes"));
app.use("/api/shares", require("./routes/shareRoutes"));
// Phase 7 routes
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/activity", require("./routes/activityRoutes"));
app.use("/api/preferences", require("./routes/preferencesRoutes"));
app.use("/api/destinations", require("./routes/destinationRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
