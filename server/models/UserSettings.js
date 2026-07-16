const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  theme: {
    type: String,
    enum: ["light", "dark", "system"],
    default: "dark"
  },
  accentColor: {
    type: String,
    enum: ["blue", "purple", "green", "orange", "red", "pink", "teal", "indigo"],
    default: "blue"
  },
  dashboardLayout: {
    type: [String],
    default: ["analytics", "weather", "budget", "trips", "suggestions", "reminders", "favorites"]
  },
  notifications: {
    email: { type: Boolean, default: false },
    browser: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true },
    budgetAlerts: { type: Boolean, default: true },
    weatherAlerts: { type: Boolean, default: true },
    packingReminders: { type: Boolean, default: true },
    aiSuggestions: { type: Boolean, default: true }
  },
  accessibility: {
    fontSize: { type: String, enum: ["small", "medium", "large", "xl"], default: "medium" },
    highContrast: { type: Boolean, default: false },
    reduceMotion: { type: Boolean, default: false },
    focusIndicators: { type: Boolean, default: true }
  },
  travel: {
    currency: { type: String, default: "USD" },
    distanceUnit: { type: String, enum: ["km", "miles"], default: "km" },
    tempUnit: { type: String, enum: ["celsius", "fahrenheit"], default: "celsius" },
    dateFormat: { type: String, default: "YYYY-MM-DD" },
    timeFormat: { type: String, enum: ["12", "24"], default: "24" },
    travelStyle: { type: String, default: "Adventure" },
    budgetRange: { type: String, default: "Moderate" }
  }
}, { timestamps: true });

module.exports = mongoose.model("UserSettings", userSettingsSchema);
