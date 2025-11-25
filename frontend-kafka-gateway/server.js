const express = require("express");
const kafka = require("kafka-node");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
app.use(express.json());

const KAFKA_BROKERS = process.env.KAFKA_BROKERS
  ? process.env.KAFKA_BROKERS.split(",")
  : ["localhost:9092"];
const PORT = process.env.PORT || 5007;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Kafka-node client setup
const client = new kafka.KafkaClient({ kafkaHost: KAFKA_BROKERS.join(",") });
const producer = new kafka.Producer(client);

// This is no longer async for kafka-node, as connection is handled by client internally
const initializeKafkaProducer = () => {
  return new Promise((resolve, reject) => {
    producer.on("ready", () => {
      console.log("Kafka Producer for frontend-kafka-gateway is Ready!");
      resolve();
    });

    producer.on("error", (error) => {
      console.error(
        "Error connecting Kafka Producer for frontend-kafka-gateway:",
        error,
      );
      reject(error);
      process.exit(1); // Exit if producer fails to connect
    });
  });
};

// JWT Authentication Middleware - Aligned with auth-service/middleware/auth.js
const authenticateJWT = (req, res, next) => {
  console.log("🔐 GATEWAY AUTH HEADER:", req.headers.authorization);

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    console.log("❌ GATEWAY AUTH: No header or invalid format. Token missing.");
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid token format",
    });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("🟢 GATEWAY AUTH: DECODED USER:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.warn("❌ GATEWAY AUTH: Token invalid/expired:", err.message);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
};

// Route to publish messages to Kafka, protected by JWT authentication
app.post("/api/publish", authenticateJWT, async (req, res) => {
  const { topic, message } = req.body;

  console.log(
    `User ${req.user.id} (${req.user.email}) attempting to publish to topic: ${topic}`,
  );

  if (!topic || !message) {
    return res.status(400).send("Topic and message are required.");
  }

  const payloads = [
    {
      topic: topic,
      messages: JSON.stringify({
        ...message,
        publisher: req.user.id,
        publisherEmail: req.user.email,
        publisherUserType: req.user.userType, // <--- Added publisherUserType
        publishedAt: new Date().toISOString(),
      }),
    },
  ];

  try {
    await new Promise((resolve, reject) => {
      producer.send(payloads, (err, data) => {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    });
    res.status(200).send("Message sent to Kafka");
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
    res.status(500).send("Failed to send message to Kafka");
  }
});

app.get("/", (req, res) => {
  res.send("Frontend Kafka Gateway is running.");
});

const startServer = async () => {
  await initializeKafkaProducer(); // Wait for producer to be ready
  app.listen(PORT, () => {
    console.log(`Frontend Kafka Gateway running on port ${PORT}`);
  });
};

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing Kafka producer");
  producer.close(() => {
    console.log("Kafka Producer disconnected");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing Kafka producer");
  producer.close(() => {
    console.log("Kafka Producer disconnected");
    process.exit(0);
  });
});
