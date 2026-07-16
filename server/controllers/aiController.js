const aiService = require("../services/aiService");
const AIItinerary = require("../models/AIItinerary");
const ChatHistory = require("../models/ChatHistory");

// Simple in-memory prompt cache to avoid duplicate Gemini calls
const promptCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getCached = (key) => {
  const entry = promptCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
};
const setCache = (key, data) => promptCache.set(key, { data, ts: Date.now() });

// ─── ITINERARY ───────────────────────────────────────────────────────────────

/**
 * POST /api/ai/itinerary/generate
 * Generate a new AI itinerary (does NOT save — user explicitly saves after review).
 */
exports.generateItinerary = async (req, res) => {
  try {
    const { destination, startDate, endDate, travelers, budget, travelStyle, interests } = req.body;

    if (!destination || !startDate || !endDate || !budget) {
      return res.status(400).json({ message: "destination, startDate, endDate, and budget are required." });
    }

    // Cache key based on the prompt params
    const cacheKey = JSON.stringify({ destination, startDate, endDate, travelers, budget, travelStyle, interests });
    const cached = getCached(cacheKey);
    if (cached) return res.json({ itinerary: cached, cached: true });

    const itinerary = await aiService.generateItinerary({
      destination, startDate, endDate,
      travelers: travelers || 1,
      budget,
      travelStyle: travelStyle || "Adventure",
      interests: interests || [],
    });

    setCache(cacheKey, itinerary);
    res.json({ itinerary });
  } catch (error) {
    console.error("generateItinerary error:", error.message);
    if (error instanceof SyntaxError) {
      return res.status(502).json({ message: "AI returned invalid JSON. Please try again." });
    }
    res.status(500).json({ message: error.message || "Failed to generate itinerary." });
  }
};

/**
 * POST /api/ai/itinerary/save
 * Persist a generated itinerary to MongoDB.
 */
exports.saveItinerary = async (req, res) => {
  try {
    const { destination, tripId, prompt, generatedItinerary } = req.body;
    if (!destination || !generatedItinerary) {
      return res.status(400).json({ message: "destination and generatedItinerary are required." });
    }

    const doc = await AIItinerary.create({
      userId: req.user._id,
      tripId: tripId || null,
      destination,
      prompt: prompt || {},
      generatedItinerary,
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error("saveItinerary error:", error.message);
    res.status(500).json({ message: "Failed to save itinerary." });
  }
};

/**
 * GET /api/ai/itinerary
 * Fetch all itineraries for the authenticated user.
 */
exports.getItineraries = async (req, res) => {
  try {
    const itineraries = await AIItinerary.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("destination createdAt generatedItinerary.summary tripId");
    res.json(itineraries);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch itineraries." });
  }
};

// ─── CHAT ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * Send a message and get an AI reply.  History is persisted to MongoDB.
 */
exports.chatMessage = async (req, res) => {
  try {
    const { message, tripId, historyId } = req.body;
    if (!message) return res.status(400).json({ message: "message is required." });

    let chatDoc;

    // Load or create conversation history
    if (historyId) {
      chatDoc = await ChatHistory.findOne({ _id: historyId, userId: req.user._id });
    }
    if (!chatDoc) {
      chatDoc = new ChatHistory({ userId: req.user._id, tripId: tripId || null, messages: [] });
    }

    // Append user message
    chatDoc.messages.push({ role: "user", content: message });

    // Build history array for Gemini (role "assistant" → "model" mapping done in service)
    const historyForAI = chatDoc.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const reply = await aiService.chatResponse(historyForAI);

    // Append assistant reply
    chatDoc.messages.push({ role: "assistant", content: reply });
    await chatDoc.save();

    res.json({ reply, historyId: chatDoc._id });
  } catch (error) {
    console.error("chatMessage error:", error.message);
    res.status(500).json({ message: error.message || "AI chat failed." });
  }
};

/**
 * GET /api/ai/chat/history
 * Fetch latest chat session for the authenticated user.
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { historyId } = req.query;
    let doc;
    if (historyId) {
      doc = await ChatHistory.findOne({ _id: historyId, userId: req.user._id });
    } else {
      doc = await ChatHistory.findOne({ userId: req.user._id }).sort({ updatedAt: -1 });
    }
    res.json(doc || { messages: [] });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chat history." });
  }
};

// ─── BUDGET INSIGHTS ──────────────────────────────────────────────────────────

/**
 * POST /api/ai/budget-insights
 * Generate AI cost-saving tips for a trip's budget context.
 */
exports.getBudgetInsights = async (req, res) => {
  try {
    const { destination, budget, totalSpent, expenses } = req.body;
    if (!destination || budget == null) {
      return res.status(400).json({ message: "destination and budget are required." });
    }

    const cacheKey = `budget:${destination}:${budget}:${totalSpent}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json({ tips: cached, cached: true });

    const tips = await aiService.getBudgetInsights({ destination, budget, totalSpent: totalSpent || 0, expenses });
    setCache(cacheKey, tips);
    res.json({ tips });
  } catch (error) {
    console.error("getBudgetInsights error:", error.message);
    res.status(500).json({ message: error.message || "Failed to generate budget insights." });
  }
};

// ─── TRAVEL TIPS ──────────────────────────────────────────────────────────────

/**
 * GET /api/ai/travel-tips?destination=Paris
 */
exports.getTravelTips = async (req, res) => {
  try {
    const { destination } = req.query;
    if (!destination) return res.status(400).json({ message: "destination query param is required." });

    const cacheKey = `tips:${destination.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json({ tips: cached, cached: true });

    const tips = await aiService.getTravelTips(destination);
    setCache(cacheKey, tips);
    res.json({ tips });
  } catch (error) {
    console.error("getTravelTips error:", error.message);
    res.status(500).json({ message: error.message || "Failed to generate travel tips." });
  }
};
