const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateJWT, isTraveler } = require('../middleware/auth');

router.use(authenticateJWT);
router.use(isTraveler);

router.post('/:propertyId', favoriteController.addFavorite);
router.delete('/:propertyId', favoriteController.removeFavorite);
router.get('/', favoriteController.getFavorites);
router.get('/:propertyId/check', favoriteController.checkFavorite);

module.exports = router;
