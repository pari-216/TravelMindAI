const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications, markRead, markAllRead, deleteNotification, clearAll,
} = require("../controllers/notificationController");

router.use(protect);
router.get("/", getNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markRead);
router.delete("/", clearAll);
router.delete("/:id", deleteNotification);
module.exports = router;
