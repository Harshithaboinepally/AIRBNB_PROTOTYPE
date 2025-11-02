const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const propertyController = require('../controllers/propertyController');
const { isAuthenticated, isOwner } = require('../middleware/auth');
const upload = require('../config/multer');
const validate = require('../middleware/validation');

// Validation rules
const propertyValidation = [
    body('property_name').trim().notEmpty().withMessage('Property name is required'),
    body('property_type').isIn(['house', 'apartment', 'condo', 'villa', 'cabin', 'other']).withMessage('Invalid property type'),
    body('description').optional().trim(),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').optional().trim().isLength({ max: 2 }),
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('price_per_night').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('bedrooms').isInt({ min: 0 }).withMessage('Valid number of bedrooms required'),
    body('bathrooms').isInt({ min: 0 }).withMessage('Valid number of bathrooms required'),
    body('max_guests').isInt({ min: 1 }).withMessage('Valid number of max guests required'),
    body('amenities').optional().isArray()
];

// Public routes
router.get('/search', propertyController.searchProperties);
router.get('/:id', propertyController.getPropertyById);

// Protected routes - Owner only
router.post('/', isAuthenticated, isOwner, propertyValidation, validate, propertyController.createProperty);
router.put('/:id', isAuthenticated, isOwner, propertyValidation, validate, propertyController.updateProperty);
router.delete('/:id', isAuthenticated, isOwner, propertyController.deleteProperty);
router.get('/owner/my-properties', isAuthenticated, isOwner, propertyController.getOwnerProperties);
router.post('/:id/images', isAuthenticated, isOwner, upload.array('propertyImages', 10), propertyController.uploadPropertyImages);

module.exports = router;