const aiService = require("../services/aiService");
const PackingList = require("../models/PackingList");

// ─── GENERATE & SAVE ─────────────────────────────────────────────────────────

/**
 * POST /api/packing/generate
 * Generate an AI packing list and save it to MongoDB.
 */
exports.generatePackingList = async (req, res) => {
  try {
    const { destination, tripId, startDate, endDate, weather, travelStyle, activities } = req.body;
    if (!destination) return res.status(400).json({ message: "destination is required." });

    const items = await aiService.generatePackingList({ destination, startDate, endDate, weather, travelStyle, activities });

    const list = await PackingList.create({
      userId: req.user._id,
      tripId: tripId || null,
      destination,
      startDate: startDate || "",
      endDate: endDate || "",
      weather: weather || "",
      travelStyle: travelStyle || "Adventure",
      activities: activities || [],
      generatedItems: items.map((i) => ({ ...i, packed: false })),
      customItems: [],
      completionPercentage: 0,
    });

    res.status(201).json(list);
  } catch (error) {
    console.error("generatePackingList error:", error.message);
    res.status(500).json({ message: error.message || "Failed to generate packing list." });
  }
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────

exports.getPackingLists = async (req, res) => {
  try {
    const lists = await PackingList.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("tripId", "name destination");
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch packing lists." });
  }
};

// ─── GET ONE ─────────────────────────────────────────────────────────────────

exports.getPackingList = async (req, res) => {
  try {
    const list = await PackingList.findOne({ _id: req.params.id, userId: req.user._id }).populate("tripId", "name destination");
    if (!list) return res.status(404).json({ message: "Packing list not found." });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch packing list." });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────

/**
 * PUT /api/packing/:id
 * Update a packing list — handles toggling items, editing, adding custom items.
 */
exports.updatePackingList = async (req, res) => {
  try {
    const list = await PackingList.findOne({ _id: req.params.id, userId: req.user._id });
    if (!list) return res.status(404).json({ message: "Packing list not found." });

    const { generatedItems, customItems } = req.body;
    if (generatedItems !== undefined) list.generatedItems = generatedItems;
    if (customItems !== undefined) list.customItems = customItems;

    // Recompute completion percentage
    const all = [...list.generatedItems, ...list.customItems];
    list.completionPercentage = all.length > 0
      ? Math.round((all.filter((i) => i.packed).length / all.length) * 100)
      : 0;

    await list.save();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to update packing list." });
  }
};

// ─── DELETE ─────────────────────────────────────────────────────────────────

exports.deletePackingList = async (req, res) => {
  try {
    const list = await PackingList.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!list) return res.status(404).json({ message: "Packing list not found." });
    res.json({ message: "Packing list deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete packing list." });
  }
};
