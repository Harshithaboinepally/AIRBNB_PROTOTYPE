const db = require('../config/database');

// Create booking (Traveler only)
const createBooking = async (req, res) => {
    try {
        const travelerId = req.user.id;
        const { property_id, check_in_date, check_out_date, num_guests } = req.body;

        // Get property details and owner
        const [properties] = await db.query(
            'SELECT owner_id, price_per_night, max_guests, is_available FROM properties WHERE property_id = ?',
            [property_id]
        );

        if (properties.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const property = properties[0];

        if (!property.is_available) {
            return res.status(400).json({ 
                error: 'Property not available',
                message: 'This property is currently unavailable for booking' 
            });
        }

        if (num_guests > property.max_guests) {
            return res.status(400).json({ 
                error: 'Too many guests',
                message: `Property can accommodate maximum ${property.max_guests} guests` 
            });
        }

        // Check for date conflicts with accepted bookings
        const [conflicts] = await db.query(
            `SELECT booking_id FROM bookings 
             WHERE property_id = ? AND status = 'ACCEPTED'
             AND NOT (check_out_date <= ? OR check_in_date >= ?)`,
            [property_id, check_in_date, check_out_date]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ 
                error: 'Dates not available',
                message: 'Property is already booked for selected dates' 
            });
        }

        // Calculate total price
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const totalPrice = nights * property.price_per_night;

        // Create booking
        const [result] = await db.query(
            `INSERT INTO bookings (property_id, traveler_id, owner_id, check_in_date, check_out_date, num_guests, total_price, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [property_id, travelerId, property.owner_id, check_in_date, check_out_date, num_guests, totalPrice]
        );

        res.status(201).json({
            message: 'Booking request created successfully',
            booking: {
                bookingId: result.insertId,
                status: 'PENDING',
                totalPrice,
                nights
            }
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not create booking' 
        });
    }
};

// Get traveler's bookings
const getTravelerBookings = async (req, res) => {
    try {
        const travelerId = req.user.id;
        const { status } = req.query;

        let query = `
            SELECT b.*, p.property_name, p.location, p.city, p.country,
                   (SELECT image_url FROM property_images WHERE property_id = p.property_id AND is_primary = 1 LIMIT 1) as property_image
            FROM bookings b
            JOIN properties p ON b.property_id = p.property_id
            WHERE b.traveler_id = ?
        `;
        const params = [travelerId];

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.booking_date DESC';

        const [bookings] = await db.query(query, params);

        res.json({ bookings });

    } catch (error) {
        console.error('Get traveler bookings error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not retrieve bookings' 
        });
    }
};

// Get owner's bookings
const getOwnerBookings = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const { status } = req.query;

        let query = `
            SELECT b.*, p.property_name, u.name as traveler_name, u.email as traveler_email
            FROM bookings b
            JOIN properties p ON b.property_id = p.property_id
            JOIN users u ON b.traveler_id = u.user_id
            WHERE b.owner_id = ?
        `;
        const params = [ownerId];

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.booking_date DESC';

        const [bookings] = await db.query(query, params);

        res.json({ bookings });

    } catch (error) {
        console.error('Get owner bookings error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not retrieve bookings' 
        });
    }
};

// Accept booking (Owner only)
const acceptBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.user.id;

        // Get booking details
        const [bookings] = await db.query(
            'SELECT * FROM bookings WHERE booking_id = ?',
            [id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookings[0];

        if (booking.owner_id !== ownerId) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: 'You do not have permission to accept this booking' 
            });
        }

        if (booking.status !== 'PENDING') {
            return res.status(400).json({ 
                error: 'Invalid status',
                message: 'Only pending bookings can be accepted' 
            });
        }

        // Check for conflicts again
        const [conflicts] = await db.query(
            `SELECT booking_id FROM bookings 
             WHERE property_id = ? AND status = 'ACCEPTED' AND booking_id != ?
             AND NOT (check_out_date <= ? OR check_in_date >= ?)`,
            [booking.property_id, id, booking.check_in_date, booking.check_out_date]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ 
                error: 'Date conflict',
                message: 'Property is already booked for these dates' 
            });
        }

        // Accept booking
        await db.query(
            'UPDATE bookings SET status = ? WHERE booking_id = ?',
            ['ACCEPTED', id]
        );

        res.json({ message: 'Booking accepted successfully' });

    } catch (error) {
        console.error('Accept booking error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not accept booking' 
        });
    }
};

// Cancel booking (Owner or Traveler)
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { cancellation_reason } = req.body;

        // Get booking details
        const [bookings] = await db.query(
            'SELECT * FROM bookings WHERE booking_id = ?',
            [id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookings[0];

        // Check if user is owner or traveler
        if (booking.owner_id !== userId && booking.traveler_id !== userId) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: 'You do not have permission to cancel this booking' 
            });
        }

        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ 
                error: 'Already cancelled',
                message: 'This booking is already cancelled' 
            });
        }

        // Cancel booking
        await db.query(
            'UPDATE bookings SET status = ?, cancelled_by = ?, cancellation_reason = ? WHERE booking_id = ?',
            ['CANCELLED', userId, cancellation_reason, id]
        );

        res.json({ message: 'Booking cancelled successfully' });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not cancel booking' 
        });
    }
};

// Get booking by ID
const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [bookings] = await db.query(
            `SELECT b.*, p.property_name, p.location, p.city, p.country, p.property_type,
                    u1.name as traveler_name, u1.email as traveler_email,
                    u2.name as owner_name, u2.email as owner_email
             FROM bookings b
             JOIN properties p ON b.property_id = p.property_id
             JOIN users u1 ON b.traveler_id = u1.user_id
             JOIN users u2 ON b.owner_id = u2.user_id
             WHERE b.booking_id = ?`,
            [id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookings[0];

        // Check if user has access to this booking
        if (booking.traveler_id !== userId && booking.owner_id !== userId) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: 'You do not have permission to view this booking' 
            });
        }

        res.json({ booking });

    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not retrieve booking' 
        });
    }
};

module.exports = {
    createBooking,
    getTravelerBookings,
    getOwnerBookings,
    acceptBooking,
    cancelBooking,
    getBookingById
};