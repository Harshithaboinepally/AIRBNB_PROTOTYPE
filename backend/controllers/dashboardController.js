const mongoose = require("mongoose"); // Added for ObjectId
const Bookings = require("../schemas/bookings");
const Properties = require("../schemas/properties"); // Changed to Properties
const Favorites = require("../schemas/favorites"); // Changed to Favorites
const PropertyImages = require("../schemas/propertyImages");
const Users = require("../schemas/users"); // Changed to Users

// Traveler dashboard
const getTravelerDashboard = async (req, res) => {
  try {
    const travelerId = req.session.userId;

    // Get booking statistics
    const stats = await Bookings.aggregate([
      { $match: { traveler_id: new mongoose.Types.ObjectId(travelerId) } },
      {
        $group: {
          _id: null,
          total_bookings: { $sum: 1 },
          pending_bookings: {
            $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
          },
          accepted_bookings: {
            $sum: { $cond: [{ $eq: ["$status", "ACCEPTED"] }, 1, 0] },
          },
          cancelled_bookings: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);

    // Get upcoming trips (accepted bookings with future dates)
    const upcomingTrips = await Bookings.find({
      traveler_id: new mongoose.Types.ObjectId(travelerId),
      status: "ACCEPTED",
      check_in_date: { $gte: new Date() },
    })
      .populate("property_id", "property_name city country")
      .sort({ check_in_date: 1 })
      .limit(5);

    const upcomingTripsWithImages = await Promise.all(
      upcomingTrips.map(async (booking) => {
        const primaryImage = await PropertyImages.findOne({
          property_id: booking.property_id._id,
          is_primary: true,
        });
        return {
          ...booking.toObject(),
          property_image: primaryImage ? primaryImage.image_url : null,
        };
      }),
    );

    // Get recent bookings
    const recentBookings = await Bookings.find({
      traveler_id: new mongoose.Types.ObjectId(travelerId),
    })
      .populate("property_id", "property_name city country")
      .sort({ created_at: -1 })
      .limit(5);

    // Get favorites count
    const favoritesCount = await Favorites.countDocuments({
      user_id: new mongoose.Types.ObjectId(travelerId),
    }); // Changed to Favorites

    res.json({
      statistics:
        stats.length > 0
          ? stats[0]
          : {
              total_bookings: 0,
              pending_bookings: 0,
              accepted_bookings: 0,
              cancelled_bookings: 0,
            },
      upcomingTrips: upcomingTripsWithImages,
      recentBookings,
      favoritesCount,
    });
  } catch (error) {
    console.error("Get traveler dashboard error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not retrieve dashboard data",
    });
  }
};

// Owner dashboard
const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.session.userId;

    // Get property statistics
    const propertyStats = await Properties.aggregate([
      // Changed to Properties
      { $match: { owner_id: new mongoose.Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: null,
          total_properties: { $sum: 1 },
          available_properties: {
            $sum: { $cond: [{ $eq: ["$is_available", true] }, 1, 0] },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);

    // Get booking statistics
    const bookingStats = await Bookings.aggregate([
      { $match: { owner_id: new mongoose.Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: null,
          total_bookings: { $sum: 1 },
          pending_bookings: {
            $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
          },
          accepted_bookings: {
            $sum: { $cond: [{ $eq: ["$status", "ACCEPTED"] }, 1, 0] },
          },
          total_revenue: { $sum: "$total_price" },
        },
      },
      { $project: { _id: 0 } },
    ]);

    // Get pending booking requests
    const pendingRequests = await Bookings.find({
      owner_id: new mongoose.Types.ObjectId(ownerId),
      status: "PENDING",
    })
      .populate("property_id", "property_name")
      .populate("traveler_id", "name")
      .sort({ created_at: -1 })
      .limit(10);

    // Get upcoming bookings
    const upcomingBookings = await Bookings.find({
      owner_id: new mongoose.Types.ObjectId(ownerId),
      status: "ACCEPTED",
      check_in_date: { $gte: new Date() },
    })
      .populate("property_id", "property_name")
      .populate("traveler_id", "name")
      .sort({ check_in_date: 1 })
      .limit(5);

    // Get recent properties
    const recentProperties = await Properties.aggregate([
      {
        $addFields: {
          property_id: "$_id",
        },
      },
      {
        $match: {
          owner_id: new mongoose.Types.ObjectId(ownerId),
        },
      },
    ])
      .sort({ created_at: -1 })
      .limit(5);

    const recentPropertiesWithImages = await Promise.all(
      recentProperties.map(async (property) => {
        const primaryImage = await PropertyImages.findOne({
          property_id: property._id,
          is_primary: true,
        });
        return {
          ...property,
          primary_image: primaryImage ? primaryImage.image_url : null,
        };
      }),
    );

    res.json({
      propertyStatistics:
        propertyStats.length > 0
          ? propertyStats[0]
          : { total_properties: 0, available_properties: 0 },
      bookingStatistics:
        bookingStats.length > 0
          ? bookingStats[0]
          : {
              total_bookings: 0,
              pending_bookings: 0,
              accepted_bookings: 0,
              total_revenue: 0,
            },
      pendingRequests,
      upcomingBookings,
      recentProperties: recentPropertiesWithImages,
    });
  } catch (error) {
    console.error("Get owner dashboard error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not retrieve dashboard data",
    });
  }
};

module.exports = {
  getTravelerDashboard,
  getOwnerDashboard,
};
