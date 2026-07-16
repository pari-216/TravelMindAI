const ActivityLog = require("../models/ActivityLog");

// GET /api/activity
exports.getActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      ActivityLog.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments({ userId: req.user._id }),
    ]);

    res.json({ activities, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch activity." });
  }
};

// POST /api/activity (internal)
exports.logActivity = async (userId, { type, title, description, entityId, entityType, icon }) => {
  try {
    await ActivityLog.create({ userId, type, title, description, entityId, entityType, icon });
  } catch (err) {
    console.error("logActivity error:", err.message);
  }
};
