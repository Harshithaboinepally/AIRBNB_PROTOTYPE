const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const mongoURI = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}/airbnb_booking`;

    if (!mongoURI) {
      console.error("❌ MONGODB_URI is not defined in your .env file.");
      process.exit(1); // Exit process with failure
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Remove useCreateIndex and useFindAndModify if using Mongoose 6.0+
      // useCreateIndex: true,
      // useFindAndModify: false,
    });
    console.log("✅ Successfully connected to MongoDB database");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB database:", err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
