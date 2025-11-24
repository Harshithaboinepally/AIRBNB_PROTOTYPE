const mongoose = require("mongoose");
const { Schema, SchemaTypes, model } = mongoose;

const propertyImagesSchema = new Schema(
  {
    property_id: {
      type: SchemaTypes.ObjectId,
      ref: "properties",
      required: true,
    },
    image_url: {
      type: String,
      required: true,
      maxLength: 500,
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
    display_order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const PropertyImages = model("property_images", propertyImagesSchema);
module.exports = PropertyImages;
