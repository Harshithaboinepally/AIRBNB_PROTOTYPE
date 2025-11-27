const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const validate = require("../middleware/validation");
const { authenticateJWT } = require("../middleware/auth");

// Validation rules
const signupValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    ),

  body("name").trim().notEmpty().withMessage("Name is required"),

  body("userType")
    .isIn(["traveler", "owner"])
    .withMessage("User type must be traveler or owner"),

  body("phone_number")
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be exactly 10 digits"),

  body("city").optional().trim(),

  body("state")
    .optional()
    .trim()
    .isLength({ max: 2 })
    .withMessage("State must be 2-letter abbreviation"),

  body("country").optional().trim(),
];
const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),

  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/signup", signupValidation, validate, authController.signup);
router.post("/login", loginValidation, validate, authController.login);
router.post("/logout", authController.logout);
router.get("/session", authController.checkSession);
router.get("/me", authenticateJWT, authController.getCurrentUser);

module.exports = router;
