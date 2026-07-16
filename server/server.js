const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
