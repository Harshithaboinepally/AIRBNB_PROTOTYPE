const Bookings = require("../schemas/bookings");
const Property = require("../schemas/properties");
const PropertyImages = require("../schemas/propertyImages");
const Users = require("../schemas/users");

// Helper function to standardize internal responses
const handleResult = (success, statusCode, data) => {
  if (success) {
    console.log(
      `Internal action success (Status ${statusCode}):`,
      data.message || data,
    );
  } else {
    console.error(
      `Internal action error (Status ${statusCode}):`,
      data.error || data.message || data,
    );
  }
  return { success, statusCode, ...data };
};

// Create booking (Traveler only)
const createBooking = async (input) => {
  // Removed 'res' parameter
  try {
    const {
      property_id,
      check_in_date,
      check_out_date,
      num_guests,
      userId,
      userType,
    } = input;

    // Authorization check
    if (userType !== "traveler") {
      return handleResult(false, 403, {
        error: "Forbidden",
        message: "Only travelers can create bookings.",
      });
    }

    if (!(property_id.length === 24 && parseInt(property_id, 16))) {
      return handleResult(false, 422, {
        error: "Property ID must be a 24 character hex string.",
      });
    }

    // Get property details and owner
    const property = await Property.findById(property_id);

    if (!property) {
      return handleResult(false, 404, { error: "Property not found" });
    }

    if (!property.is_available) {
      return handleResult(false, 400, {
        error: "Property not available",
        message: "This property is currently unavailable for booking",
      });
    }

    if (num_guests > property.max_guests) {
      return handleResult(false, 400, {
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
      return handleResult(false, 400, {
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
      traveler_id: userId,
      owner_id: property.owner_id,
      check_in_date,
      check_out_date,
      num_guests,
      total_price: totalPrice,
      status: "PENDING",
    });

    return handleResult(true, 201, {
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
    return handleResult(false, 500, {
      error: "Server error",
      message: "Could not create booking",
    });
  }
};

// Get traveler's bookings (This function might be removed if queries are handled differently in a pure event-driven model)
const getTravelerBookings = async (input) => {
  // Removed 'res' parameter
  try {
    const { userId, status } = input;
    const travelerId = userId;

    let filter = { traveler_id: travelerId };
    if (status) {
      filter.status = status;
    }

    const bookings = await Bookings.find(filter)
      .populate({
        path: "property_id",
        select: "property_name location city country",
      })
      .sort({ booking_date: -1 });

    const bookingsWithFlattenedProperty = await Promise.all(
      bookings.map(async (booking) => {
        const primaryImage = await PropertyImages.findOne({
          property_id: booking.property_id._id,
          is_primary: true,
        });

        const bookingObject = booking.toObject();
        const originalPropertyId = bookingObject.property_id._id.toString();

        const { _id, ...restPropertyDetails } = bookingObject.property_id;

        delete bookingObject.property_id;

        return {
          ...bookingObject,
          property_id: originalPropertyId,
          ...restPropertyDetails,
          primary_image: primaryImage ? primaryImage.image_url : null,
        };
      }),
    );

    return handleResult(true, 200, { bookings: bookingsWithFlattenedProperty });
  } catch (error) {
    console.error("Get traveler bookings error:", error);
    return handleResult(false, 500, {
      error: "Server error",
      message: "Could not retrieve bookings",
    });
  }
};

// Get owner's bookings (This function might be removed if queries are handled differently)
const getOwnerBookings = async (input) => {
  // Removed 'res' parameter
  try {
    const { userId, status } = input;
    const ownerId = userId;

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

    return handleResult(true, 200, { bookings: formattedBookings });
  } catch (error) {
    console.error("Get owner bookings error:", error);
    return handleResult(false, 500, {
      error: "Server error",
      message: "Could not retrieve bookings",
    });
  }
};

// Accept booking (Owner only)
const acceptBooking = async (input) => {
  // Removed 'res' parameter
  try {
    const { bookingId, userId, userType } = input;
    const ownerId = userId;

    // Authorization check
    if (userType !== "owner") {
      return handleResult(false, 403, {
        error: "Forbidden",
        message: "Only owners can accept bookings.",
      });
    }

    if (!(bookingId.length === 24 && parseInt(bookingId, 16))) {
      return handleResult(false, 422, {
        error: "Booking ID must be a 24 character hex string.",
      });
    }

    // Get booking details
    const booking = await Bookings.findById(bookingId);

    if (!booking) {
      return handleResult(false, 404, { error: "Booking not found" });
    }

    if (booking.owner_id.toString() !== ownerId) {
      return handleResult(false, 403, {
        error: "Forbidden",
        message: "You do not have permission to accept this booking",
      });
    }

    if (booking.status !== "PENDING") {
      return handleResult(false, 400, {
        error: "Invalid status",
        message: "Only pending bookings can be accepted",
      });
    }

    // Check for conflicts again with other ACCEPTED bookings, excluding the current one
    const conflicts = await Bookings.find({
      property_id: booking.property_id,
      status: "ACCEPTED",
      _id: { $ne: bookingId },
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
      return handleResult(false, 400, {
        error: "Date conflict",
        message: "Property is already booked for these dates",
      });
    }

    // Accept booking
    await Bookings.findByIdAndUpdate(
      bookingId,
      { status: "ACCEPTED" },
      { new: true },
    );

    return handleResult(true, 200, {
      message: "Booking accepted successfully",
    });
  } catch (error) {
    console.error("Accept booking error:", error);
    return handleResult(false, 500, {
      error: "Server error",
      message: "Could not accept booking",
    });
  }
};

// Cancel booking (Owner or Traveler)
const cancelBooking = async (input) => {
  // Removed 'res' parameter
  try {
    const { bookingId, userId, cancellation_reason } = input;

    if (!(bookingId.length === 24 && parseInt(bookingId, 16))) {
      return handleResult(false, 422, {
        error: "Booking ID must be a 24 character hex string.",
      });
    }

    // Get booking details
    const booking = await Bookings.findById(bookingId);

    if (!booking) {
      return handleResult(false, 404, { error: "Booking not found" });
    }

    // Check if user is owner or traveler
    if (
      booking.owner_id.toString() !== userId &&
      booking.traveler_id.toString() !== userId
    ) {
      return handleResult(false, 403, {
        error: "Forbidden",
        message: "You do not have permission to cancel this booking",
      });
    }

    if (booking.status === "CANCELLED") {
      return handleResult(false, 400, {
        error: "Already cancelled",
        message: "This booking is already cancelled",
      });
    }

    // Cancel booking
    await Bookings.findByIdAndUpdate(
      bookingId,
      { status: "CANCELLED", cancelled_by: userId, cancellation_reason },
      { new: true },
    );

    return handleResult(true, 200, {
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return handleResult(false, 500, {
      error: "Server error",
      message: "Could not cancel booking",
    });
  }
};

// Get booking by ID (This function might be removed if queries are handled differently)
const getBookingById = async (input) => {
  // Removed 'res' parameter
  try {
    const { bookingId, userId } = input;

    if (!(bookingId.length === 24 && parseInt(bookingId, 16))) {
      return handleResult(false, 422, {
        error: "Booking ID must be a 24 character hex string.",
      });
    }

    const booking = await Bookings.findById(bookingId)
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
      return handleResult(false, 404, { error: "Booking not found" });
    }

    // Check if user has access to this booking
    if (
      booking.traveler_id._id.toString() !== userId &&
      booking.owner_id._id.toString() !== userId
    ) {
      return handleResult(false, 403, {
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

    return handleResult(true, 200, { booking: formattedBooking });
  } catch (error) {
    console.error("Get booking error:", error);
    return handleResult(false, 500, {
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
