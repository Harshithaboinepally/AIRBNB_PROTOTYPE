const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticateJWT, isTraveler, isOwner } = require("../middleware/auth");

router.get(
  "/traveler",
  authenticateJWT,
  isTraveler,
  dashboardController.getTravelerDashboard,
);
router.get(
  "/owner",
  authenticateJWT,
  isOwner,
  dashboardController.getOwnerDashboard,
);

module.exports = router;
