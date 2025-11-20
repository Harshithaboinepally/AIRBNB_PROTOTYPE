const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const Users = require("../schemas/users"); // Assuming your User schema is exported as 'Users'
const mongoose = require("mongoose"); // Needed for creating ObjectId

// Signup Controller
const signup = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      userType,
      phone_number,
      city,
      state,
      country,
    } = req.body;

    // Check if user already exists
    const existingUser = await Users.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const newUser = await Users.create({
      email,
      password_hash: passwordHash,
      name,
      user_type: userType,
      phone_number: phone_number || null,
      city: city || null,
      state: state || null,
      country: country || null,
    });

    // Create session
    req.session.userId = newUser._id.toString(); // Use _id and convert to string
    req.session.userType = userType;
    req.session.email = email;
    req.session.name = name;

    res.status(201).json({
      message: "User registered successfully",
      user: {
        userId: newUser._id.toString(),
        email,
        name,
        userType,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Server error",
      message: "An error occurred during signup",
    });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Create session
    req.session.userId = user._id.toString(); // Use _id and convert to string
    req.session.userType = user.user_type;
    req.session.email = user.email;
    req.session.name = user.name;

    res.json({
      message: "Login successful",
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        userType: user.user_type,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Server error",
      message: "An error occurred during login",
    });
  }
};

// Logout Controller
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: "Logout failed",
        message: "Could not logout, please try again",
      });
    }
    res.clearCookie("airbnb.sid");
    res.json({ message: "Logout successful" });
  });
};

// Check Session Controller
const checkSession = async (req, res) => {
  if (req.session && req.session.userId) {
    try {
      // Fetch fresh user data
      const user = await Users.findById(req.session.userId);

      if (!user) {
        return res.status(401).json({
          authenticated: false,
          message: "User not found",
        });
      }

      res.json({
        authenticated: true,
        user: {
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          userType: user.user_type,
          profilePicture: user.profile_picture, // Assuming this field exists in your User schema
        },
      });
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Could not verify session",
      });
    }
  } else {
    res.json({
      authenticated: false,
      message: "No active session",
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  checkSession,
};
