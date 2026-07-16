const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getDestinations, addDestination, updateDestination, deleteDestination } = require("../controllers/destinationController");
router.use(protect);
router.route("/").get(getDestinations).post(addDestination);
router.route("/:id").put(updateDestination).delete(deleteDestination);
module.exports = router;
