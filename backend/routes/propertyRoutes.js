const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const propertyController = require('../controllers/propertyController');
const { authenticateJWT, isOwner } = require('../middleware/auth');
const upload = require('../config/multer');
const validate = require('../middleware/validation');

// Public Routes
router.get('/search', propertyController.searchProperties);
router.get('/:id', propertyController.getPropertyById);

// Owner Protected Routes
router.post('/', authenticateJWT, isOwner, propertyController.createProperty);
router.put('/:id', authenticateJWT, isOwner, propertyController.updateProperty);
router.delete('/:id', authenticateJWT, isOwner, propertyController.deleteProperty);
router.get('/owner/my-properties', authenticateJWT, isOwner, propertyController.getOwnerProperties);
router.post('/:id/images', authenticateJWT, isOwner, upload.array('propertyImages', 10), propertyController.uploadPropertyImages);

module.exports = router;
