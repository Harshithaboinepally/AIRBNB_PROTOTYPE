const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

// Import configurations
const sessionConfig = require("./config/session");
const connectDB = require("./config/mongo_database");

// Import routes
const bookingRoutes = require("./routes/bookingRoutes");
// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session(sessionConfig));

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Booking service is running!",
  });
});

connectDB();

// API Routes - MAKE SURE THESE ARE HERE
app.use("/api/bookings", bookingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);

  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

// Start server
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Booking service running on port ${PORT}`);
});

module.exports = app;
