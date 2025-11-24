const mongoose = require("mongoose"); // Added for ObjectId
const Bookings = require("../schemas/bookings");
const Properties = require("../schemas/properties");
const PropertyImages = require("../schemas/propertyImages");

// Create property (Owner only)
const createProperty = async (req, res) => {
  try {
    const ownerId = req.user.id;
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
    } = req.body;

    // Insert property
    const newProperty = await Properties.create({
      owner_id: ownerId, // Mongoose will handle casting to ObjectId if ownerId is a string
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
      amenities: amenities || [], // Ensure amenities is an array
    });

    res.status(201).json({
      message: "Property created successfully",
      propertyId: newProperty._id, // Use _id for the newly created document
    });
  } catch (error) {
    console.error("Create property error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not create property",
    });
  }
};

// Get property by ID
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(id.length === 24 && parseInt(id, 16))) {
      res
        .status(422)
        .json({ error: "Property ID must be a 24 character hex string." });
      return;
    }
    let property = await Properties.findById(id);
    if (!property) {
      res.status(404).json({ error: "Property not found" });
    }

    property = property.toObject();

    // Get property images
    const images = await PropertyImages.find({ property_id: id });
    property.images = images;

    res.json({ property });
  } catch (error) {
    console.error("Get property error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not retrieve property",
    });
  }
};

// Search properties
const searchProperties = async (req, res) => {
  try {
    const {
      location,
      startDate,
      endDate,
      guests,
      minPrice,
      maxPrice,
      propertyType,
    } = req.query;

    let filter = {
      $and: [{ is_available: true }],
    };

    // Location filter
    if (location) {
      filter["$and"].push({
        $or: [
          {
            location: { $regex: `.*${location}.*` },
          },
          {
            city: { $regex: `.*${location}.*` },
          },
          {
            state: { $regex: `.*${location}.*` },
          },
          {
            country: { $regex: `.*${location}.*` },
          },
        ],
      });
    }
    // Guest filter
    if (guests) {
      filter["$and"].push({
        max_guests: { $gte: parseInt(guests) },
      });
    }

    // Price filter
    if (minPrice) {
      filter["$and"].push({
        price_per_night: { $gte: parseInt(minPrice) },
      });
    }
    if (maxPrice) {
      filter["$and"].push({
        price_per_night: { $lte: parseInt(maxPrice) },
      });
    }

    // Property type filter
    if (propertyType) {
      filter["$and"].push({
        property_type: propertyType,
      });
    }

    // Date availability filter (exclude properties with conflicting bookings)
    if (startDate && endDate) {
      const bookings = await Bookings.find({
        $and: [
          {
            check_out_date: { $lte: endDate },
          },
          {
            check_in_date: { $gte: startDate },
          },
          {
            status: "ACCEPTED",
          },
        ],
      }).select("property_id");
      console.log(bookings);

      filter["$and"].push({
        _id: { $nin: bookings },
      });
    }

    let properties = await Properties.find(filter).sort({ created_at: -1 });

    const propertiesWithImages = await Promise.all(
      properties.map(async (property) => {
        const primaryImage = await PropertyImages.findOne({
          property_id: property._id,
          is_primary: true,
        });
        return {
          ...property.toObject(),
          primary_image: primaryImage ? primaryImage.image_url : null,
          property_id: property._id,
        };
      }),
    );

    res.json({
      properties: propertiesWithImages,
      count: properties.length,
    });
  } catch (error) {
    console.error("Search properties error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not search properties",
    });
  }
};

// Update property (Owner only)
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;
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
      is_available,
    } = req.body;
    console.log(req.body);
    if (!(id.length === 24 && parseInt(id, 16))) {
      return res
        .status(422)
        .json({ error: "Property ID must be a 24 character hex string." });
    }

    // Check if property belongs to owner
    const property = await Properties.findById(id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.owner_id.toString() !== ownerId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to update this property",
      });
    }

    // Update property
    const updateFields = {
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
      amenities: amenities || [],
      is_available: is_available ?? true,
    };

    await Properties.findByIdAndUpdate(id, updateFields, { new: true });

    res.json({ message: "Property updated successfully" });
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not update property",
    });
  }
};

// Get owner's properties
const getOwnerProperties = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const properties = await Properties.aggregate([
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
    ]).sort({
      created_at: -1,
    });

    const propertiesWithDetails = await Promise.all(
      properties.map(async (property) => {
        const primaryImage = await PropertyImages.findOne({
          property_id: property._id,
          is_primary: true,
        });
        const pendingBookings = await Bookings.countDocuments({
          property_id: property._id,
          status: "PENDING",
        });

        return {
          ...property,
          primary_image: primaryImage ? primaryImage.image_url : null,
          pending_bookings: pendingBookings,
        };
      }),
    );

    res.json({ properties: propertiesWithDetails });
  } catch (error) {
    console.error("Get owner properties error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not retrieve properties",
    });
  }
};

// Upload property images
const uploadPropertyImages = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!(id.length === 24 && parseInt(id, 16))) {
      return res
        .status(422)
        .json({ error: "Property ID must be a 24 character hex string." });
    }

    // Check if property belongs to owner
    const property = await Properties.findById(id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.owner_id.toString() !== ownerId) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "You do not have permission to upload images for this property",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "No files uploaded",
        message: "Please select images to upload",
      });
    }

    // Check if this is the first image (make it primary)
    const existingImagesCount = await PropertyImages.countDocuments({
      property_id: id,
    });
    const isPrimaryUpload = existingImagesCount === 0;

    // Prepare images for insertion
    const imagesToInsert = req.files.map((file, index) => {
      const imageUrl = `/uploads/properties/${file.filename}`;
      return {
        property_id: id,
        image_url: imageUrl,
        is_primary: isPrimaryUpload && index === 0,
        display_order: existingImagesCount + index,
      };
    });

    await PropertyImages.insertMany(imagesToInsert);

    res.json({
      message: "Images uploaded successfully",
      count: req.files.length,
    });
  } catch (error) {
    console.error("Upload property images error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not upload images",
    });
  }
};

// Delete property (Owner only)
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!(id.length === 24 && parseInt(id, 16))) {
      return res
        .status(422)
        .json({ error: "Property ID must be a 24 character hex string." });
    }

    // Check if property belongs to owner
    const property = await Properties.findById(id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.owner_id.toString() !== ownerId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to delete this property",
      });
    }

    // Delete property
    await Properties.findByIdAndDelete(id);

    // Delete associated images and bookings (manual cascade)
    await PropertyImages.deleteMany({ property_id: id });
    await Bookings.deleteMany({ property_id: id });

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not delete property",
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
  deleteProperty,
};
