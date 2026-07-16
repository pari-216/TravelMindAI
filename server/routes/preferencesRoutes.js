const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getPreferences, updatePreferences } = require("../controllers/preferencesController");
router.get("/", protect, getPreferences);
router.put("/", protect, updatePreferences);
module.exports = router;
