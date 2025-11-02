const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import configurations
const sessionConfig = require('./config/session');
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
// ⭐ ADD THIS ⭐
console.log('✅ All routes imported successfully');
console.log('Auth routes type:', typeof authRoutes);
// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session(sessionConfig));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Airbnb Backend API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        database: 'Connected',
        timestamp: new Date().toISOString()
    });
});
// ⭐ ADD THIS LOGGING MIDDLEWARE ⭐
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// API Routes - MAKE SURE THESE ARE HERE
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ⭐ ADD THIS ⭐
console.log('✅ All routes registered');
console.log('Express app has', app._router?.stack?.length || 0, 'middleware/routes');

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Multer error handling
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'File size exceeds the maximum allowed limit'
            });
        }
    }
    
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path 
    });
});

// Start server
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📁 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`\n📚 API Documentation:`);
    console.log(`   Auth:       POST   /api/auth/signup`);
    console.log(`               POST   /api/auth/login`);
    console.log(`               POST   /api/auth/logout`);
    console.log(`               GET    /api/auth/session`);
    console.log(`   Users:      GET    /api/users/profile`);
    console.log(`               PUT    /api/users/profile`);
    console.log(`               POST   /api/users/profile/picture`);
    console.log(`   Properties: GET    /api/properties/search`);
    console.log(`               GET    /api/properties/:id`);
    console.log(`               POST   /api/properties`);
    console.log(`   Bookings:   POST   /api/bookings`);
    console.log(`               GET    /api/bookings/traveler`);
    console.log(`               GET    /api/bookings/owner`);
    console.log(`   Favorites:  GET    /api/favorites`);
    console.log(`               POST   /api/favorites/:propertyId`);
    console.log(`   Dashboard:  GET    /api/dashboard/traveler`);
    console.log(`               GET    /api/dashboard/owner\n`);
});

module.exports = app;