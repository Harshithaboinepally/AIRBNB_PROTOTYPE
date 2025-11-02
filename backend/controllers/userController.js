const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// Get user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.session.userId;

        const [users] = await db.query(
            `SELECT user_id, email, name, user_type, phone_number, about_me, 
                    city, state, country, languages, gender, profile_picture, created_at
             FROM users WHERE user_id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        res.json({ user: users[0] });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not retrieve profile' 
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name, phone_number, about_me, city, state, country, languages, gender } = req.body;

        await db.query(
            `UPDATE users 
             SET name = ?, phone_number = ?, about_me = ?, city = ?, 
                 state = ?, country = ?, languages = ?, gender = ?
             WHERE user_id = ?`,
            [name, phone_number, about_me, city, state, country, languages, gender, userId]
        );

        // Fetch updated profile
        const [users] = await db.query(
            `SELECT user_id, email, name, user_type, phone_number, about_me, 
                    city, state, country, languages, gender, profile_picture
             FROM users WHERE user_id = ?`,
            [userId]
        );

        // Update session name
        req.session.name = name;

        res.json({
            message: 'Profile updated successfully',
            user: users[0]
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not update profile' 
        });
    }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!req.file) {
            return res.status(400).json({ 
                error: 'No file uploaded',
                message: 'Please select an image to upload' 
            });
        }

        // Get old profile picture
        const [users] = await db.query(
            'SELECT profile_picture FROM users WHERE user_id = ?',
            [userId]
        );

        const oldPicture = users[0]?.profile_picture;

        // Create URL for the uploaded file
        const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

        // Update database
        await db.query(
            'UPDATE users SET profile_picture = ? WHERE user_id = ?',
            [profilePictureUrl, userId]
        );

        // Delete old picture if exists
        if (oldPicture) {
            const oldPicturePath = path.join(__dirname, '..', oldPicture);
            if (fs.existsSync(oldPicturePath)) {
                fs.unlinkSync(oldPicturePath);
            }
        }

        res.json({
            message: 'Profile picture uploaded successfully',
            profilePicture: profilePictureUrl
        });

    } catch (error) {
        console.error('Upload profile picture error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Could not upload profile picture' 
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadProfilePicture
};