const bcrypt = require("bcryptjs");
const db = require("../config/database");
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
        { expiresIn: "7d" }
    );
};

// -----------------------------
// SIGNUP (JWT Version)
// -----------------------------
const signup = async (req, res) => {
    try {
        const { email, password, name, userType, phone_number, city, state, country } = req.body;

        // Check if user already exists
        const [existingUsers] = await db.query(
            "SELECT user_id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                error: "User already exists",
                message: "An account with this email already exists",
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert into DB
        const [result] = await db.query(
            `INSERT INTO users (email, password_hash, name, user_type, phone_number, city, state, country)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                email,
                passwordHash,
                name,
                userType,
                phone_number || null,
                city || null,
                state || null,
                country || null,
            ]
        );

        const newUser = {
            user_id: result.insertId,
            email,
            name,
            user_type: userType,
        };

        const token = generateToken(newUser);

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser.user_id,
                name: newUser.name,
                email: newUser.email,
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

// -----------------------------
// LOGIN (JWT Version)
// -----------------------------
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const [users] = await db.query(
            "SELECT user_id, email, password_hash, name, user_type FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: "Invalid credentials",
                message: "Email or password is incorrect",
            });
        }

        const user = users[0];

        // Compare password
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({
                error: "Invalid credentials",
                message: "Email or password is incorrect",
            });
        }

        const token = generateToken(user);

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user.user_id,
                email: user.email,
                name: user.name,
                userType: user.user_type
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            error: "Server error",
            message: "An error occurred during login",
        });
    }
};

// -----------------------------
// LOGOUT
// -----------------------------
const logout = async (req, res) => {
    return res.json({ message: "Logout successful" });
};

// -----------------------------
// CHECK SESSION (Not used in JWT)
// -----------------------------
const checkSession = (req, res) => {
    return res.json({
        authenticated: false,
        message: "No session — using JWT",
    });
};

// Add this function to authController.js
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await db.query(
            `SELECT user_id, email, name, user_type, phone_number, 
                    city, state, country, profile_picture
             FROM users WHERE user_id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                error: 'User not found',
                message: 'User account not found' 
            });
        }

        const user = users[0];

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
                profile_picture: user.profile_picture
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not retrieve user data' 
        });
    }
};

// Update module.exports
module.exports = {
    signup,
    login,
    logout,
    checkSession,
    getCurrentUser  // ADD THIS
};
