const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const {
  getAnalytics,
} = require("../controllers/analyticsController");

router.get(
  "/",
  authMiddleware,
  getAnalytics
);

module.exports = router;