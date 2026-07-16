const express = require("express");
const router = express.Router();
const { getTrips, getTripById, createTrip, updateTrip, deleteTrip } = require("../controllers/tripController");
const { protect } = require("../middleware/authMiddleware");
const validateInput = require("../middleware/validateInput");
const activityLogger = require("../middleware/activityLogger");

const tripValidation = {
  destination: { required: true, minLength: 2 },
  startDate: { required: true, type: "date" },
  endDate: { required: true, type: "date" },
};

router.route("/")
  .get(protect, getTrips)
  .post(
    protect,
    validateInput(tripValidation),
    activityLogger("trip_created", "Created trip to {body.destination}", "New itinerary starting on {body.startDate}", "✈️"),
    createTrip
  );

router.route("/:id")
  .get(protect, getTripById)
  .put(
    protect,
    validateInput(tripValidation),
    activityLogger("trip_updated", "Updated trip to {body.destination}", "Itinerary changes saved", "🔄"),
    updateTrip
  )
  .delete(
    protect,
    activityLogger("trip_deleted", "Deleted a trip", "Trip entry removed", "🗑️"),
    deleteTrip
  );

module.exports = router;
