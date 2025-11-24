const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

// Import configurations
const sessionConfig = require("./config/session");
const connectDB = require("./config/mongo_database");

// Import routes
const propertyRoutes = require("./routes/propertyRoutes");
// ⭐ ADD THIS ⭐
console.log("✅ All routes imported successfully");
console.log("Auth routes type:", typeof authRoutes);
// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session(sessionConfig));

// Serve static files (uploaded images)
app.use(
  "/uploads/properties",
  express.static(path.join(__dirname, "uploads", "properties")),
);

connectDB();

// API Routes - MAKE SURE THESE ARE HERE
app.use("/api/properties", propertyRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Property Service is running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);

  // Multer error handling
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: "File size exceeds the maximum allowed limit",
      });
    }
  }

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
app.listen(PORT, () => {
  console.log(`🚀 Property service running on port ${PORT}`);
});

module.exports = app;
