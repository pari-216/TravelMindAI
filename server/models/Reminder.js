const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["Flight", "Hotel", "Packing", "Passport", "Visa", "Transportation", "Expense", "General"],
      default: "General",
    },
    date: { type: String, required: true },
    time: { type: String, default: "09:00" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    completed: { type: Boolean, default: false },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", reminderSchema);
