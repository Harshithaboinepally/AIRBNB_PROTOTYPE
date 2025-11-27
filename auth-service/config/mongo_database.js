const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const mongoURI = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000,
    });
    console.log("✅ Successfully connected to MongoDB database");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB database:", err.message);
    process.exit(1);
  }
};
module.exports = connectDB;
