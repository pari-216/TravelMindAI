const Reminder = require("../models/Reminder");

// ─── CREATE ─────────────────────────────────────────────────────────────────

exports.createReminder = async (req, res) => {
  try {
    const { tripId, title, description, type, date, time, priority } = req.body;
    if (!title || !date) return res.status(400).json({ message: "title and date are required." });

    // Validate date is not in the past
    const reminderDate = new Date(`${date}T${time || "09:00"}`);
    if (reminderDate < new Date()) {
      return res.status(400).json({ message: "Reminder date cannot be in the past." });
    }

    const reminder = await Reminder.create({
      userId: req.user._id,
      tripId: tripId || null,
      title, description, type, date,
      time: time || "09:00",
      priority: priority || "Medium",
    });

    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Failed to create reminder." });
  }
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────

exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id })
      .sort({ date: 1, time: 1 })
      .populate("tripId", "name destination");
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reminders." });
  }
};

// ─── UPDATE ─────────────────────────────────────────────────────────────────

exports.updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return res.status(404).json({ message: "Reminder not found." });

    const fields = ["title", "description", "type", "date", "time", "priority", "completed", "notified", "tripId"];
    fields.forEach((f) => { if (req.body[f] !== undefined) reminder[f] = req.body[f]; });

    await reminder.save();
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Failed to update reminder." });
  }
};

// ─── DELETE ─────────────────────────────────────────────────────────────────

exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return res.status(404).json({ message: "Reminder not found." });
    res.json({ message: "Reminder deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete reminder." });
  }
};

// ─── GET UPCOMING (for Dashboard widget) ────────────────────────────────────

exports.getUpcomingReminders = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const reminders = await Reminder.find({
      userId: req.user._id,
      completed: false,
      date: { $gte: today },
    })
      .sort({ date: 1, time: 1 })
      .limit(5)
      .populate("tripId", "name");
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch upcoming reminders." });
  }
};
