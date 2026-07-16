const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getWeather } = require("../controllers/weatherController");

router.get("/", protect, getWeather);

module.exports = router;
