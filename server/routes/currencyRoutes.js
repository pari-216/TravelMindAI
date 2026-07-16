const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getRates, convert } = require("../controllers/currencyController");

router.get("/rates", protect, getRates);
router.get("/convert", protect, convert);

module.exports = router;
