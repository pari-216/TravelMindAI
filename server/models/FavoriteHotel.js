const mongoose = require("mongoose");

const FavoriteHotelSchema = new mongoose.Schema(
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
    hotelId: {
      type: String,
      default: null,
    },
    hotelData: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FavoriteHotel", FavoriteHotelSchema);

