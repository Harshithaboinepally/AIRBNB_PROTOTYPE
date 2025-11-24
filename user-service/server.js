const express = require("express");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();

// Import configurations
const sessionConfig = require("./config/session");
const connectDB = require("./config/mongo_database");

// Import routes
const userRoutes = require("./routes/userRoutes");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session(sessionConfig));

connectDB();

// API Routes - MAKE SURE THESE ARE HERE
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({ message: "User Service is running!" });
});

// ⭐ ADD THIS ⭐
console.log("✅ All routes registered");
console.log(
  "Express app has",
  app._router?.stack?.length || 0,
  "middleware/routes",
);

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
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth service running on port ${PORT}`);
});

module.exports = app;
