const mongoose = require("mongoose");
const { Schema, SchemaTypes, model } = mongoose;

const favoriteSchema = new Schema(
  {
    property_id: {
      type: SchemaTypes.ObjectId,
      ref: "properties",
      required: true,
    },
    user_id: {
      type: SchemaTypes.ObjectId,
      ref: "users",
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const Favorites = model("favorites", favoriteSchema);
module.exports = Favorites;
