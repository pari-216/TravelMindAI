const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  destination: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  travelers: {
    type: Number,
    default: 1,
  },
  travelType: {
    type: String,
    enum: ["Solo", "Family", "Friends", "Business"],
    default: "Solo"
  },
  budget: {
    type: Number,
    required: true,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Upcoming", "Ongoing", "Completed"],
    default: "Upcoming"
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  }
}, { timestamps: true });

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;
