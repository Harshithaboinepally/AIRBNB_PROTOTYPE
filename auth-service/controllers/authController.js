const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const Users = require("../schemas/users"); // Assuming your User schema is exported as 'Users'
const mongoose = require("mongoose"); // Needed for creating ObjectId
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Helper: create JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.user_id,
      email: user.email,
      name: user.name,
      userType: user.user_type,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
};

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
    const result = await Users.create({
      email,
      password_hash: passwordHash,
      name,
      user_type: userType,
      phone_number: phone_number || null,
      city: city || null,
      state: state || null,
      country: country || null,
    });

    const newUser = {
      user_id: result._id.toString(),
      email,
      name,
      user_type: userType,
    };

    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        userId: newUser.user_id,
        email: newUser.email,
        name: newUser.name,
        userType: newUser.user_type,
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
    user.user_id = user._id.toString();

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
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
  res.json({ message: "Logout successful" });
};

// Check Session Controller
const checkSession = async (req, res) => {
  return res.json({
    authenticated: false,
    message: "No session — using JWT",
  });
};

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await Users.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User account not found",
      });
    }
    user.user_id = user._id.toString();

    return res.json({
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        userType: user.user_type,
        phone_number: user.phone_number,
        city: user.city,
        state: user.state,
        country: user.country,
        profile_picture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      error: "Server error",
      message: "Could not retrieve user data",
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  checkSession,
  getCurrentUser,
};
