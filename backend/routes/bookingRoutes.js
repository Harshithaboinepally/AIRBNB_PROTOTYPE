const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { isAuthenticated, isTraveler, isOwner } = require('../middleware/auth');
const validate = require('../middleware/validation');

// Validation rules
const createBookingValidation = [
    body('property_id').isHexadecimal().withMessage('Valid property ID required'),
    body('check_in_date').isISO8601().withMessage('Valid check-in date required'),
    body('check_out_date').isISO8601().withMessage('Valid check-out date required'),
    body('num_guests').isInt({ min: 1 }).withMessage('Valid number of guests required')
];

const cancelBookingValidation = [
    body('cancellation_reason').optional().trim()
];

// All routes require authentication
router.use(isAuthenticated);

// Traveler routes
router.post('/', isTraveler, createBookingValidation, validate, bookingController.createBooking);
router.get('/traveler', isTraveler, bookingController.getTravelerBookings);

// Owner routes
router.get('/owner', isOwner, bookingController.getOwnerBookings);
router.put('/:id/accept', isOwner, bookingController.acceptBooking);

// Both traveler and owner can cancel and view
router.put('/:id/cancel', cancelBookingValidation, validate, bookingController.cancelBooking);
router.get('/:id', bookingController.getBookingById);

module.exports = router;