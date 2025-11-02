const db = require('../config/database');

// Create property (Owner only)
const createProperty = async (req, res) => {
    try {
        const ownerId = req.session.userId;
        const {
            property_name,
            property_type,
            description,
            location,
            city,
            state,
            country,
            price_per_night,
            bedrooms,
            bathrooms,
            max_guests,
            amenities
        } = req.body;

        // Insert property
        const [result] = await db.query(
            `INSERT INTO properties 
             (owner_id, property_name, property_type, description, location, city, state, country, 
              price_per_night, bedrooms, bathrooms, max_guests, amenities)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ownerId, property_name, property_type, description, location, city, state, country,
                price_per_night, bedrooms, bathrooms, max_guests, JSON.stringify(amenities || [])
            ]
        );

        res.status(201).json({
            message: 'Property created successfully',
            propertyId: result.insertId
        });

    } catch (error) {
        console.error('Create property error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not create property' 
        });
    }
};

// Get property by ID
const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        const [properties] = await db.query(
            `SELECT p.*, u.name as owner_name, u.email as owner_email, u.profile_picture as owner_picture
             FROM properties p
             JOIN users u ON p.owner_id = u.user_id
             WHERE p.property_id = ?`,
            [id]
        );

        if (properties.length === 0) {
            return res.status(404).json({ 
                error: 'Property not found' 
            });
        }

        const property = properties[0];

        // Get property images
        const [images] = await db.query(
            'SELECT * FROM property_images WHERE property_id = ? ORDER BY is_primary DESC, display_order ASC',
            [id]
        );

        property.images = images;
        // REMOVE THIS LINE - amenities is already an object/array from MySQL
        // property.amenities = JSON.parse(property.amenities || '[]');

        res.json({ property });

    } catch (error) {
        console.error('Get property error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not retrieve property' 
        });
    }
};

// Search properties
const searchProperties = async (req, res) => {
    try {
        const { location, startDate, endDate, guests, minPrice, maxPrice, propertyType } = req.query;

        let query = `
            SELECT p.*, 
                   (SELECT image_url FROM property_images WHERE property_id = p.property_id AND is_primary = 1 LIMIT 1) as primary_image
            FROM properties p
            WHERE p.is_available = 1
        `;
        const params = [];

        // Location filter
        if (location) {
    query += ` AND (p.city LIKE ? OR p.country LIKE ? OR p.location LIKE ? OR p.state LIKE ?)`;
    const locationPattern = `%${location}%`;
    params.push(locationPattern, locationPattern, locationPattern, locationPattern);
}
        // Guest filter
        if (guests) {
            query += ` AND p.max_guests >= ?`;
            params.push(parseInt(guests));
        }

        // Price filter
        if (minPrice) {
            query += ` AND p.price_per_night >= ?`;
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            query += ` AND p.price_per_night <= ?`;
            params.push(parseFloat(maxPrice));
        }

        // Property type filter
        if (propertyType) {
            query += ` AND p.property_type = ?`;
            params.push(propertyType);
        }

        // Date availability filter (exclude properties with conflicting bookings)
        if (startDate && endDate) {
            query += ` AND p.property_id NOT IN (
                SELECT property_id FROM bookings 
                WHERE status = 'ACCEPTED'
                AND NOT (check_out_date <= ? OR check_in_date >= ?)
            )`;
            params.push(startDate, endDate);
        }

        query += ` ORDER BY p.created_at DESC`;

        const [properties] = await db.query(query, params);

        // REMOVE THIS BLOCK - amenities is already an object/array from MySQL
        // properties.forEach(property => {
        //     property.amenities = JSON.parse(property.amenities || '[]');
        // });

        res.json({ 
            properties,
            count: properties.length 
        });

    } catch (error) {
        console.error('Search properties error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not search properties' 
        });
    }
};

// Update property (Owner only)
const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.session.userId;
        const {
            property_name,
            property_type,
            description,
            location,
            city,
            state,
            country,
            price_per_night,
            bedrooms,
            bathrooms,
            max_guests,
            amenities,
            is_available
        } = req.body;

        // Check if property belongs to owner
        const [properties] = await db.query(
            'SELECT owner_id FROM properties WHERE property_id = ?',
            [id]
        );

        if (properties.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (properties[0].owner_id !== ownerId) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: 'You do not have permission to update this property' 
            });
        }

        // Update property
        await db.query(
            `UPDATE properties 
             SET property_name = ?, property_type = ?, description = ?, location = ?, 
                 city = ?, state = ?, country = ?, price_per_night = ?, bedrooms = ?, 
                 bathrooms = ?, max_guests = ?, amenities = ?, is_available = ?
             WHERE property_id = ?`,
            [
                property_name, property_type, description, location, city, state, country,
                price_per_night, bedrooms, bathrooms, max_guests, 
                JSON.stringify(amenities || []), is_available ?? true, id
            ]
        );

        res.json({ message: 'Property updated successfully' });

    } catch (error) {
        console.error('Update property error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not update property' 
        });
    }
};

// Get owner's properties
const getOwnerProperties = async (req, res) => {
    try {
        const ownerId = req.session.userId;

        const [properties] = await db.query(
            `SELECT p.*,
                    (SELECT image_url FROM property_images WHERE property_id = p.property_id AND is_primary = 1 LIMIT 1) as primary_image,
                    (SELECT COUNT(*) FROM bookings WHERE property_id = p.property_id AND status = 'PENDING') as pending_bookings
             FROM properties p
             WHERE p.owner_id = ?
             ORDER BY p.created_at DESC`,
            [ownerId]
        );

        // REMOVE THIS BLOCK - amenities is already an object/array from MySQL
        // properties.forEach(property => {
        //     property.amenities = JSON.parse(property.amenities || '[]');
        // });

        res.json({ properties });

    } catch (error) {
        console.error('Get owner properties error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not retrieve properties' 
        });
    }
};

// Upload property images
const uploadPropertyImages = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.session.userId;

        // Check if property belongs to owner
        const [properties] = await db.query(
            'SELECT owner_id FROM properties WHERE property_id = ?',
            [id]
        );

        if (properties.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (properties[0].owner_id !== ownerId) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: 'You do not have permission to upload images for this property' 
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                error: 'No files uploaded',
                message: 'Please select images to upload' 
            });
        }

        // Check if this is the first image (make it primary)
        const [existingImages] = await db.query(
            'SELECT COUNT(*) as count FROM property_images WHERE property_id = ?',
            [id]
        );

        const isPrimary = existingImages[0].count === 0;

        // Insert images
        const imagePromises = req.files.map((file, index) => {
            const imageUrl = `/uploads/properties/${file.filename}`;
            return db.query(
                'INSERT INTO property_images (property_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)',
                [id, imageUrl, isPrimary && index === 0, index]
            );
        });

        await Promise.all(imagePromises);

        res.json({
            message: 'Images uploaded successfully',
            count: req.files.length
        });

    } catch (error) {
        console.error('Upload property images error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not upload images' 
        });
    }
};

// Delete property (Owner only)
const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.session.userId;

        // Check if property belongs to owner
        const [properties] = await db.query(
            'SELECT owner_id FROM properties WHERE property_id = ?',
            [id]
        );

        if (properties.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (properties[0].owner_id !== ownerId) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: 'You do not have permission to delete this property' 
            });
        }

        // Delete property (cascade will handle images and bookings)
        await db.query('DELETE FROM properties WHERE property_id = ?', [id]);

        res.json({ message: 'Property deleted successfully' });

    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not delete property' 
        });
    }
};

module.exports = {
    createProperty,
    getPropertyById,
    searchProperties,
    updateProperty,
    getOwnerProperties,
    uploadPropertyImages,
    deleteProperty
};