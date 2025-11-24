const mongoose = require("mongoose");
const { Schema, SchemaTypes, model } = mongoose;

const propertySchema = new Schema(
  {
    owner_id: {
      type: SchemaTypes.ObjectId,
      ref: "users",
      required: true,
    },
    property_name: {
      type: String,
      required: true,
      maxLength: 255,
    },
    property_type: {
      type: String,
      required: true,
      enum: ["house", "apartment", "condo", "villa", "cabin", "other"],
    },
    description: {
      type: String,
    },
    location: {
      type: String,
      required: true,
      maxLength: 255,
    },
    city: {
      type: String,
      maxLength: 100,
    },
    state: {
      type: String,
      maxLength: 2,
    },
    country: {
      type: String,
      maxLength: 100,
    },
    price_per_night: {
      type: Number,
      required: true,
    },
    bedrooms: {
      type: Number,
      min: 1,
      required: true,
    },
    bathrooms: {
      type: Number,
      min: 1,
      required: true,
    },
    max_guests: {
      type: Number,
      min: 1,
      required: true,
    },
    is_available: {
      type: Boolean,
      default: true,
    },
    amenities: {
      type: Array,
    },
  },
  {
    timestamps: true,
  },
);

const Properties = model("properties", propertySchema);
module.exports = Properties;
