const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { validationResult } = require('express-validator');

// Signup Controller
const signup = async (req, res) => {
    try {
        const { email, password, name, userType, phone_number, city, state, country } = req.body;

        // Check if user already exists
        const [existingUsers] = await db.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                error: 'User already exists',
                message: 'An account with this email already exists' 
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user into database
        const [result] = await db.query(
            `INSERT INTO users (email, password_hash, name, user_type, phone_number, city, state, country) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, passwordHash, name, userType, phone_number || null, city || null, state || null, country || null]
        );

        // Create session
        req.session.userId = result.insertId;
        req.session.userType = userType;
        req.session.email = email;
        req.session.name = name;

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                userId: result.insertId,
                email,
                name,
                userType
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'An error occurred during signup' 
        });
    }
};

// Login Controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const [users] = await db.query(
            'SELECT user_id, email, password_hash, name, user_type FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: 'Email or password is incorrect' 
            });
        }

        const user = users[0];

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: 'Email or password is incorrect' 
            });
        }

        // Create session
        req.session.userId = user.user_id;
        req.session.userType = user.user_type;
        req.session.email = user.email;
        req.session.name = user.name;

        res.json({
            message: 'Login successful',
            user: {
                userId: user.user_id,
                email: user.email,
                name: user.name,
                userType: user.user_type
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'An error occurred during login' 
        });
    }
};

// Logout Controller
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                error: 'Logout failed',
                message: 'Could not logout, please try again' 
            });
        }
        res.clearCookie('airbnb.sid');
        res.json({ message: 'Logout successful' });
    });
};

// Check Session Controller
const checkSession = async (req, res) => {
    if (req.session && req.session.userId) {
        try {
            // Fetch fresh user data
            const [users] = await db.query(
                'SELECT user_id, email, name, user_type, profile_picture FROM users WHERE user_id = ?',
                [req.session.userId]
            );

            if (users.length === 0) {
                return res.status(401).json({ 
                    authenticated: false,
                    message: 'User not found' 
                });
            }

            const user = users[0];

            res.json({
                authenticated: true,
                user: {
                    userId: user.user_id,
                    email: user.email,
                    name: user.name,
                    userType: user.user_type,
                    profilePicture: user.profile_picture
                }
            });
        } catch (error) {
            console.error('Session check error:', error);
            res.status(500).json({ 
                error: 'Server error',
                message: 'Could not verify session' 
            });
        }
    } else {
        res.json({ 
            authenticated: false,
            message: 'No active session' 
        });
    }
};

module.exports = {
    signup,
    login,
    logout,
    checkSession
};