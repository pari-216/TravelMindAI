const mongoose = require("mongoose");

const packingItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  essential: { type: Boolean, default: true },
  quantity: { type: Number, default: 1 },
  packed: { type: Boolean, default: false },
  isCustom: { type: Boolean, default: false },
});

const packingListSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
    destination: { type: String, required: true },
    startDate: { type: String },
    endDate: { type: String },
    weather: { type: String, default: "" },
    travelStyle: { type: String, default: "Adventure" },
    activities: [{ type: String }],
    generatedItems: [packingItemSchema],
    customItems: [packingItemSchema],
    completionPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual: all items combined
packingListSchema.virtual("allItems").get(function () {
  return [...this.generatedItems, ...this.customItems];
});

module.exports = mongoose.model("PackingList", packingListSchema);
