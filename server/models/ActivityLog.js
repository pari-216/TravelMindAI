const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: {
    type: String,
    enum: ["trip_created", "trip_updated", "trip_deleted", "expense_added", "expense_deleted",
           "journal_created", "journal_updated", "packing_created", "packing_completed",
           "reminder_created", "hotel_saved", "itinerary_generated", "destination_saved",
           "profile_updated", "budget_alert"],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  entityId: { type: String, default: null },
  entityType: { type: String, default: null },
  icon: { type: String, default: "📌" },
}, { timestamps: true });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
