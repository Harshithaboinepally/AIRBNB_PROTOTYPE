const Bookings = require("../schemas/bookings");
const Property = require("../schemas/properties");
const PropertyImages = require("../schemas/propertyImages");
const Users = require("../schemas/users")

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
        select: "property_name location city country",
      })
      .sort({ booking_date: -1 }); // Assuming 'created_at' or 'booking_date' field for sorting

    const bookingsWithFlattenedProperty = await Promise.all(
      bookings.map(async (booking) => {
        const primaryImage = await PropertyImages.findOne({
          property_id: booking.property_id._id,
          is_primary: true,
        });

        const bookingObject = booking.toObject();
        const originalPropertyId = bookingObject.property_id._id.toString();

        // Extract property details, excluding its original _id
        const { _id, ...restPropertyDetails } = bookingObject.property_id;

        // Delete the nested property_id object
        delete bookingObject.property_id;

        return {
          ...bookingObject,
          property_id: originalPropertyId, // Add the renamed property_id
          ...restPropertyDetails, // Spread the remaining property details
          primary_image: primaryImage ? primaryImage.image_url : null,
        };
      }),
    );

    res.json({ bookings: bookingsWithFlattenedProperty });
  } catch (error) {
    console.error("Get traveler bookings error:", error);
    res.status(500).json({
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
      .sort({ created_at: -1 }); // Assuming 'created_at' or 'booking_date' field for sorting

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

    // Check for conflicts again with other ACCEPTED bookings, excluding the current one
    const conflicts = await Bookings.find({
      property_id: booking.property_id,
      status: "ACCEPTED",
      _id: { $ne: id }, // Exclude the current booking
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
