const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
  getUpcomingReminders,
} = require("../controllers/reminderController");

router.use(protect);

router.post("/", createReminder);
router.get("/", getReminders);
router.get("/upcoming", getUpcomingReminders);
router.put("/:id", updateReminder);
router.delete("/:id", deleteReminder);

module.exports = router;
