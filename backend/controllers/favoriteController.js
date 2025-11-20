const Favorites = require("../schemas/favorites");
const Properties = require("../schemas/properties");
const PropertyImages = require("../schemas/propertyImages");

// Add to favorites
const addFavorite = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { propertyId } = req.params;

    if (!(propertyId.length === 24 && parseInt(propertyId, 16))) {
      return res
        .status(422)
        .json({ error: "Property ID must be a 24 character hex string." });
    }

    // Check if property exists
    const property = await Properties.findById(propertyId);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if already favorited
    const existingFavorite = await Favorites.findOne({
      user_id: userId,
      property_id: propertyId,
    });

    if (existingFavorite) {
      return res.status(400).json({
        error: "Already favorited",
        message: "This property is already in your favorites",
      });
    }

    // Add to favorites
    await Favorites.create({ user_id: userId, property_id: propertyId });

    res.status(201).json({ message: "Property added to favorites" });
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not add to favorites",
    });
  }
};

// Remove from favorites
const removeFavorite = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { propertyId } = req.params;

    if (!(propertyId.length === 24 && parseInt(propertyId, 16))) {
      return res
        .status(422)
        .json({ error: "Property ID must be a 24 character hex string." });
    }

    const result = await Favorites.deleteOne({
      user_id: userId,
      property_id: propertyId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: "Not found",
        message: "Property not in favorites",
      });
    }

    res.json({ message: "Property removed from favorites" });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not remove from favorites",
    });
  }
};

// Get user's favorites
const getFavorites = async (req, res) => {
  try {
    const userId = req.session.userId;

    const favorites = await Favorites.find({ user_id: userId })
      .populate({
        path: "property_id",
      })
      .sort({ created_at: -1 });

    const favoritesWithDetails = await Promise.all(
      favorites.map(async (fav) => {
        const primaryImage = await PropertyImages.findOne({
          property_id: fav.property_id._id,
          is_primary: true,
        });
        return {
          ...fav.property_id.toObject(), // Get property details
          favorite_id: fav._id,
          favorited_at: fav.created_at,
          primary_image: primaryImage ? primaryImage.image_url : null,
        };
      }),
    );

    res.json({ favorites: favoritesWithDetails });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not retrieve favorites",
    });
  }
};

// Check if property is favorited
const checkFavorite = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { propertyId } = req.params;

    if (!(propertyId.length === 24 && parseInt(propertyId, 16))) {
      return res
        .status(422)
        .json({ error: "Property ID must be a 24 character hex string." });
    }

    const favorite = await Favorites.findOne({
      user_id: userId,
      property_id: propertyId,
    });

    res.json({ isFavorited: !!favorite }); // Convert to boolean
  } catch (error) {
    console.error("Check favorite error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not check favorite status",
    });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
};
