const crypto = require("crypto");
const SharedTrip = require("../models/SharedTrip");
const Trip = require("../models/Trip");
const AIItinerary = require("../models/AIItinerary");
const Expense = require("../models/Expense");
const PackingList = require("../models/PackingList");
const TravelJournal = require("../models/TravelJournal");

/**
 * POST /api/shares/trip/:tripId
 * Generate or retrieve an existing share token for a trip
 */
exports.shareTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Check if trip exists and belongs to user
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to share this trip." });
    }

    // Check if token already exists
    let shared = await SharedTrip.findOne({ trip: tripId });
    if (!shared) {
      const shareToken = crypto.randomBytes(16).toString("hex");
      shared = await SharedTrip.create({
        trip: tripId,
        shareToken,
      });
    }

    res.json({
      shareToken: shared.shareToken,
      shareUrl: `${req.headers.origin || "http://localhost:5173"}/share/${shared.shareToken}`,
    });
  } catch (error) {
    console.error("shareTrip error:", error.message);
    res.status(500).json({ message: "Failed to generate share link." });
  }
};

/**
 * GET /api/shares/public/:token
 * Public route to fetch shared trip details (no authentication required)
 */
exports.getPublicTrip = async (req, res) => {
  try {
    const { token } = req.params;

    const shared = await SharedTrip.findOne({ shareToken: token }).populate({
      path: "trip",
      select: "-user", // do not leak user info
    });

    if (!shared || !shared.trip) {
      return res.status(404).json({ message: "Shared trip not found or expired." });
    }

    const tripId = shared.trip._id;

    // Fetch related trip details in parallel
    const [itinerary, expenses, packingList, journals] = await Promise.all([
      AIItinerary.findOne({ tripId }).select("generatedItinerary"),
      Expense.find({ trip: tripId }).select("-user"),
      PackingList.findOne({ tripId }).select("generatedItems customItems completionPercentage"),
      TravelJournal.find({ tripId }).select("-userId"),
    ]);

    res.json({
      trip: shared.trip,
      itinerary: itinerary ? itinerary.generatedItinerary : null,
      expenses: expenses || [],
      packingList: packingList ? {
        items: [...(packingList.generatedItems || []), ...(packingList.customItems || [])],
        completionPercentage: packingList.completionPercentage
      } : null,
      journals: journals || [],
    });
  } catch (error) {
    console.error("getPublicTrip error:", error.message);
    res.status(500).json({ message: "Failed to fetch public trip details." });
  }
};
