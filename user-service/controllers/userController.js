const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../middleware/auth");
const userController = require("../controllers/userController");
const upload = require("../config/multer");

// All routes need JWT
router.use(authenticateJWT);

router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.post(
  "/profile/picture",
  upload.single("profilePicture"),
  userController.uploadProfilePicture,
);

module.exports = router;
