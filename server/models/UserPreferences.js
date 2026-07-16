const mongoose = require("mongoose");

const userPreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  avatar: { type: String, default: null }, // base64 data URL or hosted URL
  phone: { type: String, default: "" },
  nationality: { type: String, default: "" },
  bio: { type: String, default: "" },
  currency: { type: String, default: "USD" },
  language: { type: String, default: "English" },
  travelStyle: {
    type: String,
    enum: ["Adventure", "Luxury", "Budget", "Business", "Family", "Solo", "Couple", "Cultural"],
    default: "Adventure",
  },
  budgetPreference: {
    type: String,
    enum: ["Budget", "Moderate", "Luxury"],
    default: "Moderate",
  },
  favoriteActivities: [{ type: String }], // ["Hiking", "Food Tours", "Museums"]
  foodPreferences: [{ type: String }],    // ["Vegetarian", "Local Cuisine", "Seafood"]
  emergencyContact: {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    relation: { type: String, default: "" },
  },
}, { timestamps: true });

module.exports = mongoose.model("UserPreferences", userPreferencesSchema);
