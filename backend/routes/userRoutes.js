const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../config/multer');
const validate = require('../middleware/validation');

// Validation rules
const updateProfileValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone_number').optional().isMobilePhone().withMessage('Valid phone number required'),
    body('about_me').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim().isLength({ max: 2 }).withMessage('State must be 2-letter abbreviation'),
    body('country').optional().trim(),
    body('languages').optional().trim(),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say'])
];

// All routes require authentication
router.use(isAuthenticated);

// Routes
router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidation, validate, userController.updateProfile);
router.post('/profile/picture', upload.single('profilePicture'), userController.uploadProfilePicture);

module.exports = router;