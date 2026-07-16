/**
 * hotelController.js
 * Real hotel recommendation system using:
 *   - MapTiler: destination geocoding
 *   - Geoapify: real hotel search
 *   - Groq AI: intelligent ranking and analysis
 */

const FavoriteHotel = require("../models/FavoriteHotel");
const mapService = require("../services/mapService");
const aiService = require("../services/aiService");

// ─── Simple In-Memory Cache for hotel searches ────────────────────────────────
const hotelCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 min

const getCached = (key) => {
  const entry = hotelCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
};
const setCache = (key, data) => hotelCache.set(key, { data, ts: Date.now() });

// ─── POST /api/hotels/search ──────────────────────────────────────────────────
/**
 * Search real hotels near a destination.
 * Flow: MapTiler geocode → Geoapify hotel search → return results
 */
exports.searchHotels = async (req, res) => {
  try {
    const { destination, guests = 1, radiusKm = 5 } = req.body;

    if (!destination || !destination.trim()) {
      return res.status(400).json({ message: "Destination is required." });
    }

    const cacheKey = `search:${destination.toLowerCase().trim()}:${radiusKm}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Step 1: Geocode destination with MapTiler
    let geoResult;
    try {
      geoResult = await mapService.geocodeDestination(destination);
    } catch (err) {
      return res.status(422).json({ message: err.message });
    }

    // Step 2: Fetch real hotels from Geoapify
    const radiusMeters = (radiusKm || 5) * 1000;
    let hotels = [];
    try {
      hotels = await mapService.getHotelsNearby(geoResult.lat, geoResult.lon, radiusMeters, 20);
    } catch (err) {
      return res.status(422).json({ message: err.message });
    }

    const result = {
      destination: geoResult.displayName,
      lat: geoResult.lat,
      lon: geoResult.lon,
      hotels,
      totalFound: hotels.length,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error("searchHotels error:", error.message);
    res.status(500).json({ message: error.message || "Failed to search hotels." });
  }
};

// ─── POST /api/hotels/analyze ─────────────────────────────────────────────────
/**
 * Send fetched hotels to Groq AI for intelligent analysis and ranking.
 */
exports.analyzeHotels = async (req, res) => {
  try {
    const { hotels, destination, guests, category } = req.body;

    if (!hotels || !Array.isArray(hotels) || hotels.length === 0) {
      return res.status(400).json({ message: "Hotels list is required." });
    }

    const cacheKey = `analyze:${destination}:${hotels.length}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ analysis: cached, cached: true });
    }

    const analysis = await aiService.analyzeRealHotels(hotels, destination, guests, category);

    // Hydrate AI picks with full hotel data
    const hotelListForAI = hotels.slice(0, 15);
    const enrichedAnalysis = {};

    for (const [key, pick] of Object.entries(analysis)) {
      const idx = (pick.hotelIndex || 1) - 1;
      const hotelData = hotelListForAI[idx] || hotelListForAI[0];
      enrichedAnalysis[key] = {
        ...pick,
        hotel: hotelData,
      };
    }

    setCache(cacheKey, enrichedAnalysis);
    res.json({ analysis: enrichedAnalysis });
  } catch (error) {
    console.error("analyzeHotels error:", error.message);
    res.status(500).json({ message: error.message || "Failed to analyze hotels." });
  }
};

// ─── GET /api/hotels/nearby-pois ─────────────────────────────────────────────
/**
 * Get nearby POIs (restaurants, attractions, transport) around a hotel.
 */
exports.getNearbyPOIs = async (req, res) => {
  try {
    const { lat, lon, type = "restaurant", radius = 1000 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: "lat and lon are required." });
    }

    const pois = await mapService.getNearbyPOIs(
      parseFloat(lat),
      parseFloat(lon),
      type,
      parseInt(radius)
    );

    res.json({ pois });
  } catch (error) {
    console.error("getNearbyPOIs error:", error.message);
    res.status(500).json({ message: "Failed to fetch nearby POIs." });
  }
};

// ─── GET /api/hotels/geocode ──────────────────────────────────────────────────
/**
 * Geocode a destination (proxy for frontend to get lat/lon without exposing API key).
 */
exports.geocodeDestination = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query is required." });

    const result = await mapService.geocodeDestination(q);
    res.json(result);
  } catch (error) {
    res.status(422).json({ message: error.message });
  }
};

// ─── GET /api/hotels/favorites ────────────────────────────────────────────────
exports.getFavorites = async (req, res) => {
  try {
    const favorites = await FavoriteHotel.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error) {
    console.error("getFavorites error:", error.message);
    res.status(500).json({ message: "Failed to fetch favorite hotels." });
  }
};

// ─── POST /api/hotels/favorites ───────────────────────────────────────────────
exports.addFavorite = async (req, res) => {
  try {
    const { tripId, hotelId, hotelData } = req.body;

    if (!hotelData || !hotelData.name) {
      return res.status(400).json({ message: "Hotel data is required." });
    }

    // Check for duplicate
    if (hotelId) {
      const existing = await FavoriteHotel.findOne({ userId: req.user._id, hotelId });
      if (existing) {
        return res.status(409).json({ message: "Hotel already saved.", favorite: existing });
      }
    }

    const favorite = await FavoriteHotel.create({
      userId: req.user._id,
      tripId: tripId || null,
      hotelId: hotelId || null,
      hotelData,
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error("addFavorite error:", error.message);
    res.status(500).json({ message: "Failed to save hotel to favorites." });
  }
};

// ─── DELETE /api/hotels/favorites/:id ────────────────────────────────────────
exports.deleteFavorite = async (req, res) => {
  try {
    const favorite = await FavoriteHotel.findOne({ _id: req.params.id, userId: req.user._id });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite hotel not found." });
    }

    await favorite.deleteOne();
    res.json({ message: "Removed hotel from favorites." });
  } catch (error) {
    console.error("deleteFavorite error:", error.message);
    res.status(500).json({ message: "Failed to remove hotel from favorites." });
  }
};

// ─── DELETE /api/hotels/favorites/hotel/:hotelId ─────────────────────────────
exports.deleteFavoriteByHotelId = async (req, res) => {
  try {
    const favorite = await FavoriteHotel.findOneAndDelete({
      hotelId: req.params.hotelId,
      userId: req.user._id,
    });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite hotel not found." });
    }

    res.json({ message: "Removed hotel from favorites." });
  } catch (error) {
    console.error("deleteFavoriteByHotelId error:", error.message);
    res.status(500).json({ message: "Failed to remove hotel from favorites." });
  }
};
