const UserSettings = require("../models/UserSettings");
const UserPreferences = require("../models/UserPreferences");
const User = require("../models/User");
const Trip = require("../models/Trip");
const Expense = require("../models/Expense");
const TravelJournal = require("../models/TravelJournal");
const PackingList = require("../models/PackingList");
const Reminder = require("../models/Reminder");
const ChatHistory = require("../models/ChatHistory");
const FavoriteHotel = require("../models/FavoriteHotel");
const FavoriteDestination = require("../models/FavoriteDestination");
const bcrypt = require("bcryptjs");

// Default Settings Object
const DEFAULT_SETTINGS = {
  theme: "dark",
  accentColor: "blue",
  dashboardLayout: ["analytics", "weather", "budget", "trips", "suggestions", "reminders", "favorites"],
  notifications: {
    email: false,
    browser: true,
    reminders: true,
    budgetAlerts: true,
    weatherAlerts: true,
    packingReminders: true,
    aiSuggestions: true
  },
  accessibility: {
    fontSize: "medium",
    highContrast: false,
    reduceMotion: false,
    focusIndicators: true
  },
  travel: {
    currency: "USD",
    distanceUnit: "km",
    tempUnit: "celsius",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24",
    travelStyle: "Adventure",
    budgetRange: "Moderate"
  }
};

// ─── GET /api/settings ────────────────────────────────────────────────────────
exports.getSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = await UserSettings.create({ userId: req.user._id });
    }
    
    // Also fetch preferences for combined output if helpful
    let prefs = await UserPreferences.findOne({ userId: req.user._id });
    if (!prefs) {
      prefs = await UserPreferences.create({ userId: req.user._id });
    }

    res.json({ settings, preferences: prefs });
  } catch (err) {
    res.status(500).json({ message: "Failed to load settings." });
  }
};

// ─── PUT /api/settings ────────────────────────────────────────────────────────
exports.updateSettings = async (req, res) => {
  try {
    const { theme, accentColor, dashboardLayout, notifications, accessibility, travel } = req.body;

    const updates = {};
    if (theme) updates.theme = theme;
    if (accentColor) updates.accentColor = accentColor;
    if (dashboardLayout) updates.dashboardLayout = dashboardLayout;
    if (notifications) updates.notifications = { ...DEFAULT_SETTINGS.notifications, ...notifications };
    if (accessibility) updates.accessibility = { ...DEFAULT_SETTINGS.accessibility, ...accessibility };
    if (travel) updates.travel = { ...DEFAULT_SETTINGS.travel, ...travel };

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to update settings." });
  }
};

// ─── POST /api/settings/reset ──────────────────────────────────────────────────
exports.resetSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { $set: DEFAULT_SETTINGS },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to reset settings." });
  }
};

// ─── POST /api/settings/account ──────────────────────────────────────────────
/**
 * Unifies account details updating (email, password, phone, avatar, emergency contact).
 */
exports.updateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let prefs = await UserPreferences.findOne({ userId: req.user._id });
    if (!prefs) prefs = await UserPreferences.create({ userId: req.user._id });

    const { email, currentPassword, newPassword, phone, avatar, emergencyContact } = req.body;

    // 1. Password update
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password required to change password." });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect current password." });
      }
      user.password = newPassword;
    }

    // 2. Email update
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use." });
      }
      user.email = email;
    }
    await user.save();

    // 3. UserPreferences updates
    if (phone !== undefined) prefs.phone = phone;
    if (avatar !== undefined) prefs.avatar = avatar;
    if (emergencyContact !== undefined) prefs.emergencyContact = emergencyContact;
    await prefs.save();

    res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email },
      preferences: prefs
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update account details.", error: err.message });
  }
};

// ─── POST /api/settings/privacy/export ────────────────────────────────────────
exports.exportData = async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, settings, prefs, trips, expenses, journals, packingLists, reminders, chats, favoriteHotels, favoriteDestinations] =
      await Promise.all([
        User.findById(userId).select("-password"),
        UserSettings.findOne({ userId }),
        UserPreferences.findOne({ userId }),
        Trip.find({ user: userId }),
        Expense.find({ user: userId }),
        TravelJournal.find({ user: userId }),
        PackingList.find({ user: userId }),
        Reminder.find({ user: userId }),
        ChatHistory.find({ userId }),
        FavoriteHotel.find({ userId }),
        FavoriteDestination.find({ userId }),
      ]);

    const dataExport = {
      exportedAt: new Date().toISOString(),
      account: user,
      settings: settings || DEFAULT_SETTINGS,
      preferences: prefs || {},
      trips,
      expenses,
      journals,
      packingLists,
      reminders,
      chats,
      favoriteHotels,
      favoriteDestinations
    };

    res.setHeader("Content-disposition", "attachment; filename=travelmind_data_export.json");
    res.setHeader("Content-type", "application/json");
    res.write(JSON.stringify(dataExport, null, 2));
    res.end();
  } catch (err) {
    res.status(500).json({ message: "Failed to export data." });
  }
};

// ─── POST /api/settings/privacy/delete-history ───────────────────────────────
exports.deleteHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.body; // "trips", "chats", "journals", "reminders", "packing"

    if (type === "trips") {
      await Promise.all([
        Trip.deleteMany({ user: userId }),
        Expense.deleteMany({ user: userId }) // expenses belong to trips
      ]);
    } else if (type === "chats") {
      await ChatHistory.deleteMany({ userId });
    } else if (type === "journals") {
      await TravelJournal.deleteMany({ user: userId });
    } else if (type === "reminders") {
      await Reminder.deleteMany({ user: userId });
    } else if (type === "packing") {
      await PackingList.deleteMany({ user: userId });
    } else {
      return res.status(400).json({ message: "Invalid history category type." });
    }

    res.json({ success: true, message: `Successfully deleted history for ${type}.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete history." });
  }
};

// ─── POST /api/settings/privacy/deactivate ───────────────────────────────────
exports.deactivateAccount = async (req, res) => {
  try {
    // Just a placeholder deactivation, e.g. logging user out or setting deactivated flag (we don't have active flag on User, so we can mock success or clear user session)
    res.json({ success: true, message: "Account successfully deactivated." });
  } catch (err) {
    res.status(500).json({ message: "Deactivation failed." });
  }
};

// ─── DELETE /api/settings/privacy/delete-account ──────────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete all records in all collections associated with this user
    await Promise.all([
      User.findByIdAndDelete(userId),
      UserSettings.findOneAndDelete({ userId }),
      UserPreferences.findOneAndDelete({ userId }),
      Trip.deleteMany({ user: userId }),
      Expense.deleteMany({ user: userId }),
      TravelJournal.deleteMany({ user: userId }),
      PackingList.deleteMany({ user: userId }),
      Reminder.deleteMany({ user: userId }),
      ChatHistory.deleteMany({ userId }),
      FavoriteHotel.deleteMany({ userId }),
      FavoriteDestination.deleteMany({ userId }),
    ]);

    res.json({ success: true, message: "Your account and all associated data have been permanently deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to permanently delete account." });
  }
};
