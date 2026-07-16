const Trip = require("../models/Trip");
const { geocodeDestination } = require("../services/geocodingService");

// @desc    Get all trips for user
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ startDate: 1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get single trip by ID
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    
    // Ensure user owns the trip
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to access this trip" });
    }

    // Cache coordinates if missing
    if (trip.latitude === null || trip.longitude === null) {
      try {
        const coords = await geocodeDestination(trip.destination, trip.country);
        if (coords) {
          trip.latitude = coords.latitude;
          trip.longitude = coords.longitude;
          await trip.save();
        }
      } catch (err) {
        console.error("Geocoding cache update failed:", err.message);
      }
    }
    
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Create a trip
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res) => {
  try {
    const { destination, country, coverImage, startDate, endDate, travelers, travelType, budget, notes } = req.body;

    if (!destination || !country || !startDate || !endDate || !budget) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Attempt geocoding on creation
    let latitude = null;
    let longitude = null;
    try {
      const coords = await geocodeDestination(destination, country);
      if (coords) {
        latitude = coords.latitude;
        longitude = coords.longitude;
      }
    } catch (err) {
      console.warn("Geocoding failed during creation:", err.message);
    }

    const trip = new Trip({
      user: req.user._id,
      destination,
      country,
      coverImage: coverImage || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80`,
      startDate,
      endDate,
      travelers: travelers || 1,
      travelType: travelType || "Solo",
      budget,
      notes,
      latitude,
      longitude
    });

    const createdTrip = await trip.save();
    res.status(201).json(createdTrip);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update a trip
// @route   PUT /api/trips/:id
// @access  Private
const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to modify this trip" });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete a trip
// @route   DELETE /api/trips/:id
// @access  Private
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to delete this trip" });
    }

    await trip.deleteOne();
    res.json({ message: "Trip removed" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { getTrips, getTripById, createTrip, updateTrip, deleteTrip };
