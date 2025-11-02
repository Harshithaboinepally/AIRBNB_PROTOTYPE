const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, isTraveler, isOwner } = require('../middleware/auth');

router.get('/traveler', isAuthenticated, isTraveler, dashboardController.getTravelerDashboard);
router.get('/owner', isAuthenticated, isOwner, dashboardController.getOwnerDashboard);

module.exports = router;