/**
 * analyticsController.js
 * Aggregates data from all existing collections for the Analytics Dashboard.
 * No new data is stored — all computed on the fly and cached briefly.
 */
const Trip = require("../models/Trip");
const Expense = require("../models/Expense");
const TravelJournal = require("../models/TravelJournal");
const PackingList = require("../models/PackingList");
const FavoriteHotel = require("../models/FavoriteHotel");
const Reminder = require("../models/Reminder");
const ActivityLog = require("../models/ActivityLog");

// 5-minute in-memory cache per user
const analyticsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = userId.toString();
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return res.json({ ...cached.data, cached: true });
    }

    // ── Parallel data fetch ────────────────────────────────────────────────
    const [trips, expenses, journals, packingLists, favoriteHotels, reminders, activities] =
      await Promise.all([
        Trip.find({ user: userId }),
        Expense.find({ user: userId }),
        TravelJournal.find({ user: userId }),
        PackingList.find({ user: userId }),
        FavoriteHotel.find({ userId }),
        Reminder.find({ user: userId }),
        ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(50),
      ]);

    // ── Core Stats ─────────────────────────────────────────────────────────
    const totalBudget = trips.reduce((s, t) => s + (t.budget || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const moneySaved = Math.max(0, totalBudget - totalExpenses);

    // Average trip duration (days)
    const tripsWithDates = trips.filter(t => t.startDate && t.endDate);
    const avgDuration = tripsWithDates.length
      ? tripsWithDates.reduce((s, t) => {
          const days = Math.max(1, Math.round((new Date(t.endDate) - new Date(t.startDate)) / 86400000));
          return s + days;
        }, 0) / tripsWithDates.length
      : 0;

    // Average daily spending
    const totalDays = tripsWithDates.reduce((s, t) => {
      return s + Math.max(1, Math.round((new Date(t.endDate) - new Date(t.startDate)) / 86400000));
    }, 0);
    const avgDailySpending = totalDays > 0 ? totalExpenses / totalDays : 0;

    // Countries & cities
    const countries = [...new Set(trips.map(t => t.country).filter(Boolean))];
    const cities = [...new Set(trips.map(t => t.destination).filter(Boolean))];

    // Packing completion rate
    const completedPacking = packingLists.filter(p =>
      p.items?.length > 0 && p.items.every(i => i.packed)
    ).length;
    const packingCompletionRate = packingLists.length
      ? Math.round((completedPacking / packingLists.length) * 100)
      : 0;

    // ── Monthly Expenses (last 12 months) ─────────────────────────────────
    const now = new Date();
    const monthlyExpenses = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const total = expenses
        .filter(e => {
          const ed = new Date(e.createdAt || e.date);
          return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
        })
        .reduce((s, e) => s + (e.amount || 0), 0);
      return { month: label, expenses: Math.round(total) };
    });

    // ── Monthly Trips ──────────────────────────────────────────────────────
    const monthlyTrips = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const count = trips.filter(t => {
        const td = new Date(t.createdAt);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
      }).length;
      return { month: label, trips: count };
    });

    // ── Budget vs Actual (per trip, last 8) ───────────────────────────────
    const budgetVsActual = trips.slice(-8).map(t => {
      const actual = expenses
        .filter(e => e.trip?.toString() === t._id.toString())
        .reduce((s, e) => s + (e.amount || 0), 0);
      return {
        name: (t.destination || "Trip").substring(0, 10),
        budget: t.budget || 0,
        actual: Math.round(actual),
      };
    });

    // ── Expense Categories ─────────────────────────────────────────────────
    const categoryMap = {};
    expenses.forEach(e => {
      const cat = e.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + (e.amount || 0);
    });
    const expenseCategories = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);

    // ── Travel Style Distribution ─────────────────────────────────────────
    const styleMap = {};
    trips.forEach(t => {
      const style = t.travelStyle || "Adventure";
      styleMap[style] = (styleMap[style] || 0) + 1;
    });
    const travelStyles = Object.entries(styleMap).map(([name, value]) => ({ name, value }));

    // ── Most Visited Countries ─────────────────────────────────────────────
    const countryMap = {};
    trips.forEach(t => {
      if (t.country) countryMap[t.country] = (countryMap[t.country] || 0) + 1;
      else if (t.destination) countryMap[t.destination] = (countryMap[t.destination] || 0) + 1;
    });
    const topCountries = Object.entries(countryMap)
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 8);

    const summary = {
      stats: {
        totalTrips: trips.length,
        countriesVisited: countries.length,
        citiesVisited: cities.length,
        totalBudget: Math.round(totalBudget),
        totalExpenses: Math.round(totalExpenses),
        moneySaved: Math.round(moneySaved),
        avgDailySpending: Math.round(avgDailySpending),
        avgTripDuration: Math.round(avgDuration),
        packingCompletionRate,
        journalEntries: journals.length,
        hotelBookmarks: favoriteHotels.length,
        reminders: reminders.length,
      },
      charts: {
        monthlyExpenses,
        monthlyTrips,
        budgetVsActual,
        expenseCategories,
        travelStyles,
        topCountries,
      },
      recentActivity: activities.slice(0, 20),
    };

    analyticsCache.set(cacheKey, { data: summary, ts: Date.now() });
    res.json(summary);
  } catch (error) {
    console.error("getSummary error:", error.message);
    res.status(500).json({ message: "Failed to load analytics." });
  }
};
