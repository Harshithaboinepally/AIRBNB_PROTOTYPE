const db = require('../config/database');

// Always use JWT user id
const getUserId = (req) => req.user?.id;

// Add to favorites
const addFavorite = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { propertyId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid user' });
        }

        // Check if property exists
        const [properties] = await db.query(
            'SELECT property_id FROM properties WHERE property_id = ?',
            [propertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Check if already favorited
        const [existing] = await db.query(
            'SELECT favorite_id FROM favorites WHERE user_id = ? AND property_id = ?',
            [userId, propertyId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                error: 'Already favorited',
                message: 'This property is already in your favorites'
            });
        }

        // Add to favorites
        await db.query(
            'INSERT INTO favorites (user_id, property_id) VALUES (?, ?)',
            [userId, propertyId]
        );

        res.status(201).json({ message: 'Property added to favorites' });

    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Could not add to favorites'
        });
    }
};

// Remove from favorites
const removeFavorite = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { propertyId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const [result] = await db.query(
            'DELETE FROM favorites WHERE user_id = ? AND property_id = ?',
            [userId, propertyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Property not in favorites'
            });
        }

        res.json({ message: 'Property removed from favorites' });

    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Could not remove from favorites'
        });
    }
};

// Get user's favorites
const getFavorites = async (req, res) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const [favorites] = await db.query(
            `SELECT p.*, f.created_at as favorited_at,
                    (SELECT image_url FROM property_images 
                     WHERE property_id = p.property_id AND is_primary = 1 LIMIT 1) as primary_image
             FROM favorites f
             JOIN properties p ON f.property_id = p.property_id
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC`,
            [userId]
        );

        res.json({ favorites });

    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Could not retrieve favorites'
        });
    }
};

// Check if property is favorited
const checkFavorite = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { propertyId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const [favorites] = await db.query(
            'SELECT favorite_id FROM favorites WHERE user_id = ? AND property_id = ?',
            [userId, propertyId]
        );

        res.json({ isFavorite: favorites.length > 0 });

    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Could not check favorite status'
        });
    }
};

module.exports = {
    addFavorite,
    removeFavorite,
    getFavorites,
    checkFavorite
};
