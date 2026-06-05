const express = require("express");

const router = express.Router();

// Controllers
const {
  register,
  login,
  getProfile,
  deleteUser,
} = require("../controllers/authController");

// Middlewares
const authMiddleware = require("../middleware/authMiddleware");

const adminMiddleware = require("../middleware/adminMiddleware");

// AUTH ROUTES

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Current logged-in user
router.get("/me", authMiddleware, getProfile);

// Delete own account
router.delete("/me", authMiddleware, deleteUser);

// ADMIN ROUTES

// Admin-only user creation
router.post(
  "/create-user",
  authMiddleware,
  adminMiddleware,
  register
);

module.exports = router;