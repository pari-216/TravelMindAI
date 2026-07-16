const aiService = require("../services/aiService");
const TravelJournal = require("../models/TravelJournal");

// ─── CREATE ──────────────────────────────────────────────────────────────────

exports.createJournal = async (req, res) => {
  try {
    const { tripId, title, date, location, mood, content, photos, tags } = req.body;
    if (!title || !date || !content) {
      return res.status(400).json({ message: "title, date, and content are required." });
    }

    const journal = await TravelJournal.create({
      userId: req.user._id,
      tripId: tripId || null,
      title, date, location, mood,
      content,
      photos: photos || [],
      tags: tags || [],
    });

    res.status(201).json(journal);
  } catch (error) {
    res.status(500).json({ message: "Failed to create journal entry." });
  }
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────

exports.getJournals = async (req, res) => {
  try {
    const journals = await TravelJournal.find({ userId: req.user._id })
      .sort({ date: -1 })
      .populate("tripId", "name destination");
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch journals." });
  }
};

// ─── GET ONE ─────────────────────────────────────────────────────────────────

exports.getJournal = async (req, res) => {
  try {
    const journal = await TravelJournal.findOne({ _id: req.params.id, userId: req.user._id }).populate("tripId", "name destination");
    if (!journal) return res.status(404).json({ message: "Journal entry not found." });
    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch journal entry." });
  }
};

// ─── UPDATE ─────────────────────────────────────────────────────────────────

exports.updateJournal = async (req, res) => {
  try {
    const journal = await TravelJournal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!journal) return res.status(404).json({ message: "Journal entry not found." });

    const fields = ["title", "date", "location", "mood", "content", "photos", "tags"];
    fields.forEach((f) => { if (req.body[f] !== undefined) journal[f] = req.body[f]; });

    await journal.save();
    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: "Failed to update journal entry." });
  }
};

// ─── DELETE ─────────────────────────────────────────────────────────────────

exports.deleteJournal = async (req, res) => {
  try {
    const journal = await TravelJournal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!journal) return res.status(404).json({ message: "Journal entry not found." });
    res.json({ message: "Journal entry deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete journal entry." });
  }
};

// ─── AI ENHANCE ──────────────────────────────────────────────────────────────

exports.enhanceJournal = async (req, res) => {
  try {
    const journal = await TravelJournal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!journal) return res.status(404).json({ message: "Journal entry not found." });

    const aiData = await aiService.enhanceJournalEntry({
      title: journal.title,
      content: journal.content,
      location: journal.location,
      date: journal.date,
      mood: journal.mood,
    });

    journal.aiEnhanced = true;
    journal.aiData = aiData;
    await journal.save();

    res.json({ aiData, journal });
  } catch (error) {
    console.error("enhanceJournal error:", error.message);
    res.status(500).json({ message: error.message || "Failed to enhance journal entry." });
  }
};
