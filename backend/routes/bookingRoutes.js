const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { authenticateJWT, isTraveler, isOwner } = require('../middleware/auth');
const validate = require('../middleware/validation');

// Must auth first
router.use(authenticateJWT);

// Traveler routes
router.post('/', isTraveler, bookingController.createBooking);
router.get('/traveler', isTraveler, bookingController.getTravelerBookings);

// Owner routes
router.get('/owner', isOwner, bookingController.getOwnerBookings);
router.put('/:id/accept', isOwner, bookingController.acceptBooking);

// Both
router.put('/:id/cancel', bookingController.cancelBooking);
router.get('/:id', bookingController.getBookingById);

module.exports = router;
