const session = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
    autoremove: "interval",
    autoRemoveInterval: 10, // Checks every 10 mins for expired sessions
    collectionName: "sessions",
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production", // true in production (requires HTTPS)
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  },
  name: "airbnb.sid", // Custom session name
};

module.exports = sessionConfig;
