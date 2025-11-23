const db = require('../config/database');

// Traveler dashboard
const getTravelerDashboard = async (req, res) => {
    try {
        const travelerId = req.user.id;

        // Get booking statistics
        const [stats] = await db.query(
            `SELECT 
                COUNT(*) as total_bookings,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_bookings,
                SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted_bookings,
                SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings
             FROM bookings
             WHERE traveler_id = ?`,
            [travelerId]
        );

        // Get upcoming trips (accepted bookings with future dates)
        const [upcomingTrips] = await db.query(
            `SELECT b.*, p.property_name, p.city, p.country,
                    (SELECT image_url FROM property_images WHERE property_id = p.property_id AND is_primary = 1 LIMIT 1) as property_image
             FROM bookings b
             JOIN properties p ON b.property_id = p.property_id
             WHERE b.traveler_id = ? AND b.status = 'ACCEPTED' AND b.check_in_date >= CURDATE()
             ORDER BY b.check_in_date ASC
             LIMIT 5`,
            [travelerId]
        );

        // Get recent bookings
        const [recentBookings] = await db.query(
            `SELECT b.*, p.property_name, p.city, p.country
             FROM bookings b
             JOIN properties p ON b.property_id = p.property_id
             WHERE b.traveler_id = ?
             ORDER BY b.booking_date DESC
             LIMIT 5`,
            [travelerId]
        );

        // Get favorites count
        const [favCount] = await db.query(
            'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
            [travelerId]
        );

        res.json({
            statistics: stats[0],
            upcomingTrips,
            recentBookings,
            favoritesCount: favCount[0].count
        });

    } catch (error) {
        console.error('Get traveler dashboard error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not retrieve dashboard data' 
        });
    }
};

// Owner dashboard
const getOwnerDashboard = async (req, res) => {
    try {
        const ownerId = req.user.id;

        // Get property statistics
        const [propertyStats] = await db.query(
            `SELECT 
                COUNT(*) as total_properties,
                SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available_properties
             FROM properties
             WHERE owner_id = ?`,
            [ownerId]
        );

        // Get booking statistics
        const [bookingStats] = await db.query(
            `SELECT 
                COUNT(*) as total_bookings,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_bookings,
                SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted_bookings,
                SUM(total_price) as total_revenue
             FROM bookings
             WHERE owner_id = ?`,
            [ownerId]
        );

        // Get pending booking requests
        const [pendingRequests] = await db.query(
            `SELECT b.*, p.property_name, u.name as traveler_name
             FROM bookings b
             JOIN properties p ON b.property_id = p.property_id
             JOIN users u ON b.traveler_id = u.user_id
             WHERE b.owner_id = ? AND b.status = 'PENDING'
             ORDER BY b.booking_date DESC
             LIMIT 10`,
            [ownerId]
        );

        // Get upcoming bookings
        const [upcomingBookings] = await db.query(
            `SELECT b.*, p.property_name, u.name as traveler_name
             FROM bookings b
             JOIN properties p ON b.property_id = p.property_id
             JOIN users u ON b.traveler_id = u.user_id
             WHERE b.owner_id = ? AND b.status = 'ACCEPTED' AND b.check_in_date >= CURDATE()
             ORDER BY b.check_in_date ASC
             LIMIT 5`,
            [ownerId]
        );

        // Get recent properties
        const [recentProperties] = await db.query(
            `SELECT p.*,
                    (SELECT image_url FROM property_images WHERE property_id = p.property_id AND is_primary = 1 LIMIT 1) as primary_image
             FROM properties p
             WHERE p.owner_id = ?
             ORDER BY p.created_at DESC
             LIMIT 5`,
            [ownerId]
        );

       // recentProperties.forEach(prop => {
         //   prop.amenities = JSON.parse(prop.amenities || '[]');
        //});

        res.json({
            propertyStatistics: propertyStats[0],
            bookingStatistics: bookingStats[0],
            pendingRequests,
            upcomingBookings,
            recentProperties
        });

    } catch (error) {
        console.error('Get owner dashboard error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not retrieve dashboard data' 
        });
    }
};

module.exports = {
    getTravelerDashboard,
    getOwnerDashboard
};