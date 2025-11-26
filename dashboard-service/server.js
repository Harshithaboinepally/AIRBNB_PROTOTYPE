const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

// Import configurations
const sessionConfig = require("./config/session");
const connectDB = require("./config/mongo_database");

// Import routes
const dashboardRoutes = require("./routes/dashboardRoutes");
// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session(sessionConfig));

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Dashboard service is running!",
  });
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes - MAKE SURE THESE ARE HERE
app.use("/api/dashboard", dashboardRoutes);
console.log(
  "After dashboardRoutes registration. Express app has",
  app._router?.stack?.length || 0,
  "middleware/routes.",
); // ADD THIS

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
  console.log(`🚀 Dashboard service running on port ${PORT}`);
});

module.exports = app;
