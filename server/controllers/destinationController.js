const FavoriteDestination = require("../models/FavoriteDestination");

// GET /api/destinations
exports.getDestinations = async (req, res) => {
  try {
    const destinations = await FavoriteDestination.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(destinations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch destinations." });
  }
};

// POST /api/destinations
exports.addDestination = async (req, res) => {
  try {
    const { name, country, lat, lon, imageUrl, notes } = req.body;
    if (!name) return res.status(400).json({ message: "Destination name is required." });

    // Check duplicate
    const existing = await FavoriteDestination.findOne({ userId: req.user._id, name });
    if (existing) return res.status(409).json({ message: "Destination already saved.", destination: existing });

    const destination = await FavoriteDestination.create({
      userId: req.user._id, name, country, lat, lon, imageUrl, notes,
    });
    res.status(201).json(destination);
  } catch (err) {
    res.status(500).json({ message: "Failed to save destination." });
  }
};

// PUT /api/destinations/:id
exports.updateDestination = async (req, res) => {
  try {
    const dest = await FavoriteDestination.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!dest) return res.status(404).json({ message: "Destination not found." });
    res.json(dest);
  } catch (err) {
    res.status(500).json({ message: "Failed to update destination." });
  }
};

// DELETE /api/destinations/:id
exports.deleteDestination = async (req, res) => {
  try {
    const dest = await FavoriteDestination.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!dest) return res.status(404).json({ message: "Destination not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete destination." });
  }
};
