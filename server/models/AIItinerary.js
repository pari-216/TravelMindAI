const mongoose = require("mongoose");

const AIItinerarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: Object, // stores the full generation params (destination, dates, budget, etc.)
      required: true,
    },
    generatedItinerary: {
      type: Object, // stores the full parsed Gemini JSON response
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIItinerary", AIItinerarySchema);
