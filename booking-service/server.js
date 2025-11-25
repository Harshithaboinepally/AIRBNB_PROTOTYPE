const dotenv = require("dotenv");
const mongoose = require("mongoose");
const kafka = require("kafka-node");
const bookingController = require("./controllers/bookingController"); // Import the refactored controller

dotenv.config();

// MongoDB Connection
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || 27017;
const DB_NAME = process.env.DB_NAME || "airbnb_db";
const MONGODB_URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if DB connection fails
  });

// Kafka Consumer Setup
const KAFKA_BROKERS = process.env.KAFKA_BROKERS
  ? process.env.KAFKA_BROKERS.split(",")
  : ["localhost:9092"];
const CONSUMER_GROUP_ID = "booking-service-group"; // Unique group ID for this service

const client = new kafka.KafkaClient({ kafkaHost: KAFKA_BROKERS.join(",") });
const consumer = new kafka.Consumer(
  client,
  [
    { topic: "booking_events", partition: 0 }, // Subscribe to booking events
    // Add other topics if booking-service needs to consume from them
  ],
  {
    groupId: CONSUMER_GROUP_ID,
    autoCommit: true,
    fromBeginning: false, // Usually false for operational events, true for initial data load
  },
);

const runKafkaConsumer = () => {
  consumer.on("message", async (message) => {
    try {
      const messageValue = JSON.parse(message.value.toString());
      console.log({
        service: "Booking Service",
        source: "Kafka Message",
        topic: message.topic,
        partition: message.partition,
        offset: message.offset,
        value: messageValue,
      });

      const {
        eventType,
        bookingData, // For createBooking
        bookingId, // For acceptBooking, cancelBooking, getBookingById
        cancellation_reason, // For cancelBooking
        publisher, // userId
        publisherUserType, // userType
      } = messageValue;

      // --- Call refactored controller functions based on eventType ---
      if (message.topic === "booking_events") {
        switch (eventType) {
          case "BOOKING_REQUESTED":
            // Pass necessary data and publisher info to createBooking
            await bookingController.createBooking({
              property_id: bookingData.property_id,
              check_in_date: bookingData.check_in_date,
              check_out_date: bookingData.check_out_date,
              num_guests: bookingData.num_guests,
              userId: publisher,
              userType: publisherUserType,
            });
            break;
          case "BOOKING_ACCEPTED":
            // Pass necessary data and publisher info to acceptBooking
            await bookingController.acceptBooking({
              bookingId: bookingId,
              userId: publisher,
              userType: publisherUserType,
            });
            break;
          case "BOOKING_CANCELLED":
            // Pass necessary data and publisher info to cancelBooking
            await bookingController.cancelBooking({
              bookingId: bookingId,
              userId: publisher,
              cancellation_reason: cancellation_reason,
            });
            break;
          // IMPORTANT: getTravelerBookings, getOwnerBookings, getBookingById are query functions.
          // In a purely event-driven service, these read operations typically wouldn't be triggered
          // by Kafka messages, but rather handled by a separate read-model service, or the
          // frontend directly querying a read-optimized data store.
          // If you *must* handle queries here, you'd need a mechanism to respond back,
          // e.g., publishing another Kafka message with the result.
          // For now, these functions are not called by Kafka events directly.

          default:
            console.log(
              `Booking Service: Unknown eventType: ${eventType} on topic ${message.topic}`,
            );
        }
      }
    } catch (error) {
      console.error("Booking Service: Error processing Kafka message:", error);
    }
  });

  consumer.on("error", (err) => {
    console.error("Booking Service: Kafka Consumer Error:", err);
  });

  consumer.on("offsetOutOfRange", (err) => {
    console.error("Booking Service: Kafka Consumer Offset Out Of Range:", err);
    // Handle this by resetting the offset or seeking to a valid one if needed
  });

  console.log(
    "Booking Service: Kafka Consumer started and listening for messages!",
  );
};

// Start the Kafka consumer after MongoDB is connected
mongoose.connection.on("connected", () => {
  console.log("Booking Service: MongoDB connected");
  runKafkaConsumer();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log(
    "Booking Service: SIGTERM signal received: closing Kafka consumer and MongoDB",
  );
  consumer.close(true, () => {
    mongoose.disconnect(() => {
      console.log("Booking Service: Kafka Consumer and MongoDB disconnected");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log(
    "Booking Service: SIGINT signal received: closing Kafka consumer and MongoDB",
  );
  consumer.close(true, () => {
    mongoose.disconnect(() => {
      console.log("Booking Service: Kafka Consumer and MongoDB disconnected");
      process.exit(0);
    });
  });
});
