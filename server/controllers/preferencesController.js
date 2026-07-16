const UserPreferences = require("../models/UserPreferences");

// GET /api/preferences
exports.getPreferences = async (req, res) => {
  try {
    let prefs = await UserPreferences.findOne({ userId: req.user._id });
    if (!prefs) {
      prefs = await UserPreferences.create({ userId: req.user._id });
    }
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ message: "Failed to load preferences." });
  }
};

// PUT /api/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const allowed = [
      "avatar", "phone", "nationality", "bio", "currency", "language",
      "travelStyle", "budgetPreference", "favoriteActivities",
      "foodPreferences", "emergencyContact",
    ];

    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const prefs = await UserPreferences.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ message: "Failed to update preferences." });
  }
};
