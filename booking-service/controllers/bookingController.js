const Bookings = require("../schemas/bookings");
const Property = require("../schemas/properties");
const PropertyImages = require("../schemas/propertyImages");
const { sendBookingEvent } = require('../kafka/producer');
const Users = require("../schemas/users");
const mongoose = require('mongoose'); 
// Create booking (Traveler only)
const createBooking = async (req, res) => {
  try {
    const travelerId = req.user.id;
    const { property_id, check_in_date, check_out_date, num_guests } = req.body;

    if (!(property_id.length === 24 && parseInt(property_id, 16))) {
      return res
        .status(422)
        .json({ error: "Property ID must be a 24 character hex string." });
    }

    // Get property details and owner
    const property = await Property.findById(property_id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (!property.is_available) {
      return res.status(400).json({
        error: "Property not available",
        message: "This property is currently unavailable for booking",
      });
    }

    if (num_guests > property.max_guests) {
      return res.status(400).json({
        error: "Too many guests",
        message: `Property can accommodate maximum ${property.max_guests} guests`,
      });
    }

    // Check for date conflicts with accepted bookings
    const conflicts = await Bookings.find({
      property_id: property_id,
      status: "ACCEPTED",
      $or: [
        { check_out_date: { $gt: check_in_date, $lte: check_out_date } },
        { check_in_date: { $lt: check_out_date, $gte: check_in_date } },
        {
          $and: [
            { check_in_date: { $lte: check_in_date } },
            { check_out_date: { $gte: check_out_date } },
          ],
        },
      ],
    });

    if (conflicts.length > 0) {
      return res.status(400).json({
        error: "Dates not available",
        message: "Property is already booked for selected dates",
      });
    }

    // Calculate total price
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * property.price_per_night;

    // Create booking
    const newBooking = await Bookings.create({
      property_id,
      traveler_id: travelerId,
      owner_id: property.owner_id,
      check_in_date,
      check_out_date,
      num_guests,
      total_price: totalPrice,
      status: "PENDING",
    });

    // ✅ SEND KAFKA EVENT - AFTER booking is created
    await sendBookingEvent('BOOKING_CREATED', {
      bookingId: newBooking._id.toString(),
      propertyId: property_id,
      travelerId: travelerId,
      ownerId: property.owner_id.toString(),
      checkIn: check_in_date,
      checkOut: check_out_date,
      totalPrice: totalPrice,
      status: 'pending'
    });

    res.status(201).json({
      message: "Booking request created successfully",
      booking: {
        bookingId: newBooking._id,
        status: newBooking.status,
        totalPrice,
        nights,
      },
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not create booking",
    });
  }
};

// Get traveler's bookings
// Get traveler's bookings
const getTravelerBookings = async (req, res) => {
  try {
    const travelerId = req.user.id;
    const { status } = req.query;

    let filter = { traveler_id: travelerId };
    if (status) {
      filter.status = status;
    }

    const bookings = await Bookings.find(filter)
      .populate({
        path: "property_id",
        select: "property_name location city country price_per_night",
      })
      .sort({ created_at: -1 }); // Changed from booking_date to created_at

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        // Get primary image
        const primaryImage = await PropertyImages.findOne({
          property_id: booking.property_id._id,
          is_primary: true,
        });

        // Return flattened structure
        return {
          _id: booking._id,
          booking_id: booking._id.toString(),
          property_id: booking.property_id._id.toString(),
          
          // Property details
          property_name: booking.property_id.property_name,
          location: booking.property_id.location,
          city: booking.property_id.city,
          country: booking.property_id.country,
          image_url: primaryImage ? primaryImage.image_url : null,
          
          // Booking details
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          num_guests: booking.num_guests,
          total_price: booking.total_price,
          status: booking.status,
          
          // Metadata
          created_at: booking.created_at,
          updated_at: booking.updated_at,
        };
      })
    );

    res.json({ 
      success: true,
      bookings: bookingsWithDetails 
    });
  } catch (error) {
    console.error("Get traveler bookings error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
      message: "Could not retrieve bookings",
    });
  }
};

// Get owner's bookings
const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { status } = req.query;

    let filter = { owner_id: ownerId };
    if (status) {
      filter.status = status;
    }

    const bookings = await Bookings.find(filter)
      .populate({
        path: "property_id",
        select: "property_name",
      })
      .populate({
        path: "traveler_id",
        select: "name email",
      })
      .sort({ created_at: -1 });

    const formattedBookings = bookings.map((booking) => ({
      ...booking.toObject(),
      property_name: booking.property_id.property_name,
      traveler_name: booking.traveler_id.name,
      traveler_email: booking.traveler_id.email,
      booking_id: booking._id,
      property_id: booking.property_id._id,
    }));

    res.json({ bookings: formattedBookings });
  } catch (error) {
    console.error("Get owner bookings error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not retrieve bookings",
    });
  }
};

// Accept booking (Owner only)
const acceptBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(422).json({ error: "Invalid booking ID format" });
  } 

    // Get booking details
    const booking = await Bookings.findById(id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.owner_id.toString() !== ownerId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to accept this booking",
      });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({
        error: "Invalid status",
        message: "Only pending bookings can be accepted",
      });
    }

    // Check for conflicts
    const conflicts = await Bookings.find({
      property_id: booking.property_id,
      status: "ACCEPTED",
      _id: { $ne: id },
      $or: [
        {
          check_out_date: {
            $gt: booking.check_in_date,
            $lte: booking.check_out_date,
          },
        },
        {
          check_in_date: {
            $lt: booking.check_out_date,
            $gte: booking.check_in_date,
          },
        },
        {
          $and: [
            { check_in_date: { $lte: booking.check_in_date } },
            { check_out_date: { $gte: booking.check_out_date } },
          ],
        },
      ],
    });

    if (conflicts.length > 0) {
      return res.status(400).json({
        error: "Date conflict",
        message: "Property is already booked for these dates",
      });
    }

    // Accept booking
    await Bookings.findByIdAndUpdate(id, { status: "ACCEPTED" }, { new: true });

    // ✅ SEND KAFKA EVENT - Make it non-blocking
    sendBookingEvent('BOOKING_ACCEPTED', {
      bookingId: id,
      propertyId: booking.property_id.toString(),
      travelerId: booking.traveler_id.toString(),
      ownerId: ownerId,
      status: 'accepted'
  }).catch(err => {
    console.error('⚠️ Kafka event failed (non-critical):', err.message);
  });

    res.json({ message: "Booking accepted successfully" });
  } catch (error) {
    console.error("Accept booking error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not accept booking",
    });
  }
};

// Cancel booking (Owner or Traveler)
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { cancellation_reason } = req.body;

    if (!(id.length === 24 && parseInt(id, 16))) {
      return res
        .status(422)
        .json({ error: "Booking ID must be a 24 character hex string." });
    }

    // Get booking details
    const booking = await Bookings.findById(id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user is owner or traveler
    if (
      booking.owner_id.toString() !== userId &&
      booking.traveler_id.toString() !== userId
    ) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to cancel this booking",
      });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({
        error: "Already cancelled",
        message: "This booking is already cancelled",
      });
    }

    // Cancel booking
    await Bookings.findByIdAndUpdate(
      id,
      { status: "CANCELLED", cancelled_by: userId, cancellation_reason },
      { new: true },
    );

    // ✅ SEND KAFKA EVENT - AFTER booking is cancelled
    await sendBookingEvent('BOOKING_CANCELLED', {
      bookingId: id,
      propertyId: booking.property_id.toString(),
      travelerId: booking.traveler_id.toString(),
      ownerId: booking.owner_id?.toString(),
      status: 'cancelled'
    });

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not cancel booking",
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!(id.length === 24 && parseInt(id, 16))) {
      return res
        .status(422)
        .json({ error: "Booking ID must be a 24 character hex string." });
    }

    const booking = await Bookings.findById(id)
      .populate({
        path: "property_id",
        select: "property_name location city country property_type",
      })
      .populate({
        path: "traveler_id",
        select: "name email",
      })
      .populate({
        path: "owner_id",
        select: "name email",
      });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user has access to this booking
    if (
      booking.traveler_id._id.toString() !== userId &&
      booking.owner_id._id.toString() !== userId
    ) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to view this booking",
      });
    }

    const formattedBooking = {
      ...booking.toObject(),
      property_name: booking.property_id.property_name,
      location: booking.property_id.location,
      city: booking.property_id.city,
      country: booking.property_id.country,
      property_type: booking.property_id.property_type,
      traveler_name: booking.traveler_id.name,
      traveler_email: booking.traveler_id.email,
      owner_name: booking.owner_id.name,
      owner_email: booking.owner_id.email,
    };

    res.json({ booking: formattedBooking });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not retrieve booking",
    });
  }
};

module.exports = {
  createBooking,
  getTravelerBookings,
  getOwnerBookings,
  acceptBooking,
  cancelBooking,
  getBookingById,
};