const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: {
    type: String,
    enum: ["trip", "budget", "reminder", "ai", "packing", "weather", "hotel", "system"],
    default: "system",
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  link: { type: String, default: null }, // e.g. /dashboard/trips/123
  icon: { type: String, default: null }, // emoji or icon name
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
