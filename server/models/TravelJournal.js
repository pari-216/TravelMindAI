const mongoose = require("mongoose");

const travelJournalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
    title: { type: String, required: true },
    date: { type: String, required: true },
    location: { type: String, default: "" },
    mood: { type: String, default: "Happy" },
    content: { type: String, required: true },
    photos: [{ type: String }],
    tags: [{ type: String }],
    aiEnhanced: { type: Boolean, default: false },
    aiData: {
      improvedContent: { type: String, default: "" },
      catchyTitle: { type: String, default: "" },
      hashtags: [{ type: String }],
      caption: { type: String, default: "" },
      summary: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TravelJournal", travelJournalSchema);
