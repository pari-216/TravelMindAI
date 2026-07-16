const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateItinerary,
  saveItinerary,
  getItineraries,
  chatMessage,
  getChatHistory,
  getBudgetInsights,
  getTravelTips,
} = require("../controllers/aiController");

// All AI routes require authentication
router.use(protect);

// Itinerary
router.post("/itinerary/generate", generateItinerary);
router.post("/itinerary/save", saveItinerary);
router.get("/itinerary", getItineraries);

// Chat
router.post("/chat", chatMessage);
router.get("/chat/history", getChatHistory);

// Budget Advisor
router.post("/budget-insights", getBudgetInsights);

// Travel Tips
router.get("/travel-tips", getTravelTips);

module.exports = router;
