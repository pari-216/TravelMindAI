const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  searchHotels,
  analyzeHotels,
  getNearbyPOIs,
  geocodeDestination,
  getFavorites,
  addFavorite,
  deleteFavorite,
  deleteFavoriteByHotelId,
} = require("../controllers/hotelController");

// All hotel routes require authentication
router.use(protect);

// Real hotel search (MapTiler + Geoapify)
router.post("/search", searchHotels);

// AI analysis of fetched hotels (Groq)
router.post("/analyze", analyzeHotels);

// Nearby POIs (Geoapify)
router.get("/nearby-pois", getNearbyPOIs);

// Geocoding proxy (MapTiler)
router.get("/geocode", geocodeDestination);

// Favorites (MongoDB)
router.get("/favorites", getFavorites);
router.post("/favorites", addFavorite);
router.delete("/favorites/:id", deleteFavorite);
router.delete("/favorites/hotel/:hotelId", deleteFavoriteByHotelId);

module.exports = router;
