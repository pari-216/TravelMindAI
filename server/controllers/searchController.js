/**
 * searchController.js
 * Global search across all user collections.
 */
const Trip = require("../models/Trip");
const Expense = require("../models/Expense");
const TravelJournal = require("../models/TravelJournal");
const PackingList = require("../models/PackingList");
const Reminder = require("../models/Reminder");

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ results: {}, query: q || "" });
    }

    const userId = req.user._id;
    const query = q.trim();
    const regex = new RegExp(query, "i");

    // Parallel search across all collections
    const [trips, expenses, journals, packingLists, reminders] = await Promise.all([
      Trip.find({ user: userId, $or: [{ destination: regex }, { country: regex }, { notes: regex }] })
        .select("destination country startDate endDate budget status").limit(5),
      Expense.find({ user: userId, $or: [{ description: regex }, { category: regex }] })
        .select("description category amount date").limit(5),
      TravelJournal.find({ user: userId, $or: [{ title: regex }, { content: regex }, { location: regex }] })
        .select("title location date mood").limit(5),
      PackingList.find({ user: userId, $or: [{ name: regex }, { destination: regex }] })
        .select("name destination").limit(5),
      Reminder.find({ user: userId, $or: [{ title: regex }, { description: regex }] })
        .select("title description dueDate completed").limit(5),
    ]);

    const results = {
      trips: trips.map(t => ({
        id: t._id, type: "trip",
        title: t.destination || "Unnamed Trip",
        subtitle: `${t.country || ""} · ${t.startDate ? new Date(t.startDate).toLocaleDateString() : ""}`,
        link: `/dashboard/trips/${t._id}`,
        icon: "✈️",
      })),
      expenses: expenses.map(e => ({
        id: e._id, type: "expense",
        title: e.description || "Expense",
        subtitle: `${e.category} · $${e.amount}`,
        link: "/dashboard/expenses",
        icon: "💰",
      })),
      journals: journals.map(j => ({
        id: j._id, type: "journal",
        title: j.title || "Journal Entry",
        subtitle: `${j.location || ""} · ${j.mood || ""}`,
        link: "/dashboard/journal",
        icon: "📓",
      })),
      packingLists: packingLists.map(p => ({
        id: p._id, type: "packing",
        title: p.name || "Packing List",
        subtitle: p.destination || "",
        link: "/dashboard/packing",
        icon: "🧳",
      })),
      reminders: reminders.map(r => ({
        id: r._id, type: "reminder",
        title: r.title || "Reminder",
        subtitle: r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "",
        link: "/dashboard/reminders",
        icon: "🔔",
      })),
    };

    const totalCount = Object.values(results).reduce((s, arr) => s + arr.length, 0);
    res.json({ results, query, totalCount });
  } catch (error) {
    console.error("globalSearch error:", error.message);
    res.status(500).json({ message: "Search failed." });
  }
};
