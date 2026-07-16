const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getSettings,
  updateSettings,
  resetSettings,
  updateAccount,
  exportData,
  deleteHistory,
  deactivateAccount,
  deleteAccount,
} = require("../controllers/settingsController");

router.use(protect);

router.route("/").get(getSettings).put(updateSettings);
router.post("/reset", resetSettings);
router.post("/account", updateAccount);
router.get("/privacy/export", exportData);
router.post("/privacy/delete-history", deleteHistory);
router.post("/privacy/deactivate", deactivateAccount);
router.delete("/privacy/delete-account", deleteAccount);

module.exports = router;
