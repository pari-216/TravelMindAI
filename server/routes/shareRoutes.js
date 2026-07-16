const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { shareTrip, getPublicTrip } = require("../controllers/shareController");

// Authenticated route to generate share link
router.post("/trip/:tripId", protect, shareTrip);

// Secure route to fetch Google Maps API key
router.get("/config/maps", protect, (req, res) => {
  res.json({ googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "" });
});

// Public route to view shared trip details (unauthenticated)
router.get("/public/:token", getPublicTrip);

module.exports = router;
