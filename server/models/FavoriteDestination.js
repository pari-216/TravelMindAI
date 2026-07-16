const mongoose = require("mongoose");

const favoriteDestinationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  country: { type: String, default: "" },
  lat: { type: Number, default: null },
  lon: { type: Number, default: null },
  imageUrl: { type: String, default: null },
  notes: { type: String, default: "" },
  visitCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("FavoriteDestination", favoriteDestinationSchema);
