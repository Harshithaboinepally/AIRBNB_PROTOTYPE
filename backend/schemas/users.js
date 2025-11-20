const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      maxLength: 255,
    },
    password_hash: {
      type: String,
      required: true,
      maxLength: 255,
    },
    name: {
      type: String,
      required: true,
      maxLength: 100,
    },
    user_type: {
      type: String,
      required: true,
      enum: ["traveler", "owner"],
    },
    phone_number: {
      type: String,
      maxLength: 20,
    },
    about_me: {
      type: String,
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
    languages: {
      type: String,
      maxLength: 255,
    },
    gender: {
      type: String,
      enum: ["male", "female", "prefer_not_to_say"],
    },
    profile_picture: {
      type: String,
      maxLength: 500,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const Users = model("users", userSchema);
module.exports = Users;
