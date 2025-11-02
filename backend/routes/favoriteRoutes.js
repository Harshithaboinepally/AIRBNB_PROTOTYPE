const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { isAuthenticated, isTraveler } = require('../middleware/auth');

// All routes require authentication and traveler role
router.use(isAuthenticated);
router.use(isTraveler);

router.post('/:propertyId', favoriteController.addFavorite);
router.delete('/:propertyId', favoriteController.removeFavorite);
router.get('/', favoriteController.getFavorites);
router.get('/:propertyId/check', favoriteController.checkFavorite);

module.exports = router;