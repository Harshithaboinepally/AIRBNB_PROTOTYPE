const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Authenticate JWT
const authenticateJWT = (req, res, next) => {
    console.log("🔐 AUTH HEADER:", req.headers.authorization);

    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        console.log("❌ No header. Token missing.");
        return res.status(401).json({
            error: "Unauthorized",
            message: "Missing or invalid token"
        });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("🟢 DECODED USER:", decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.log("❌ Token invalid/expired");
        return res.status(401).json({
            error: "Unauthorized",
            message: "Invalid or expired token"
        });
    }
};

// Traveler Role
const isTraveler = (req, res, next) => {
    if (req.user?.userType === "traveler") return next();
    return res.status(403).json({
        error: "Forbidden",
        message: "Traveler access only"
    });
};

// Owner Role
const isOwner = (req, res, next) => {
    if (req.user?.userType === "owner") return next();
    return res.status(403).json({
        error: "Forbidden",
        message: "Owner access only"
    });
};

module.exports = {
    authenticateJWT,
    isTraveler,
    isOwner
};
