const mongoose = require("mongoose");
const { Schema, SchemaTypes, model } = mongoose;

const bookingSchema = new Schema(
  {
    property_id: {
      type: SchemaTypes.ObjectId,
      ref: "properties",
      required: true,
    },
    traveler_id: {
      type: SchemaTypes.ObjectId,
      ref: "users",
      required: true,
    },
    owner_id: {
      type: SchemaTypes.ObjectId,
      ref: "users",
      required: true,
    },
    check_in_date: {
      type: Date,
      required: true,
    },
    check_out_date: {
      type: Date,
      required: true,
    },
    num_guests: {
      type: Number,
      required: true,
    },
    total_price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "CANCELLED"],
      default: "PENDING",
    },
    cancelled_by: {
      type: Number,
    },
    cancellation_reason: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "booking_date",
      updatedAt: "updated_at",
    },
  },
);

const Bookings = model("bookings", bookingSchema);
module.exports = Bookings;
