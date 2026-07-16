const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createJournal,
  getJournals,
  getJournal,
  updateJournal,
  deleteJournal,
  enhanceJournal,
} = require("../controllers/journalController");

router.use(protect);

router.post("/", createJournal);
router.get("/", getJournals);
router.get("/:id", getJournal);
router.put("/:id", updateJournal);
router.delete("/:id", deleteJournal);
router.post("/:id/enhance", enhanceJournal);

module.exports = router;
