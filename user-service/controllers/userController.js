const User = require("../schemas/users");
const path = require("path");
const fs = require("fs");

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!(userId.length === 24 && parseInt(userId, 16))) {
      res
        .status(422)
        .json({ error: "User ID must be a 24 character hex string." });
      return;
    }
    const data = await User.findById(userId);
    if (!data) {
      res.status(404).json({ error: "User not found" });
    }

    res.send(data);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not retrieve profile",
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!(userId.length === 24 && parseInt(userId, 16))) {
      res
        .status(422)
        .json({ error: "User ID must be a 24 character hex string." });
      return;
    }
    const data = await User.findById(userId);
    if (!data) {
      res.status(404).json({ error: "User not found" });
    }

    const {
      name,
      phone_number,
      about_me,
      city,
      state,
      country,
      languages,
      gender,
    } = req.body;

    data.name = name;
    data.phone_number = phone_number;
    data.about_me = about_me;
    data.city = city;
    data.state = state;
    data.country = country;
    data.languages = languages;
    data.gender = gender;

    await data.save();

    // Fetch updated profile
    const updatedData = await User.findById(userId);
    if (!updatedData) {
      res.status(404).json({ error: "User not found" });
    }

    // Update session name
    // req.session.name = name;

    res.json({
      message: "Profile updated successfully",
      user: updatedData,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not update profile",
    });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
        message: "Please select an image to upload",
      });
    }

    if (!(userId.length === 24 && parseInt(userId, 16))) {
      res
        .status(422)
        .json({ error: "User ID must be a 24 character hex string." });
      return;
    }
    const data = await User.findById(userId);
    if (!data) {
      res.status(404).json({ error: "User not found" });
    }

    // Get old profile picture
    const oldPicture = data.profile_picture;

    // Create URL for the uploaded file
    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    // Update database
    data.profile_picture = profilePictureUrl;
    await data.save();

    // Delete old picture if exists
    if (oldPicture) {
      const oldPicturePath = path.join(__dirname, "..", oldPicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    res.json({
      message: "Profile picture uploaded successfully",
      profilePicture: profilePictureUrl,
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Could not upload profile picture",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
};
