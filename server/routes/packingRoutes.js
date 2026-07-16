const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generatePackingList,
  getPackingLists,
  getPackingList,
  updatePackingList,
  deletePackingList,
} = require("../controllers/packingController");

router.use(protect);

router.post("/generate", generatePackingList);
router.get("/", getPackingLists);
router.get("/:id", getPackingList);
router.put("/:id", updatePackingList);
router.delete("/:id", deletePackingList);

module.exports = router;
