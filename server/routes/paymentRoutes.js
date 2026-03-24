const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createCheckoutSession,
  stripeWebhook,
} = require("../controllers/paymentController");

const router = express.Router();

// Student starts checkout for a paid course.
router.post(
  "/checkout-session",
  protect,
  authorizeRoles("student"),
  createCheckoutSession
);

// Stripe webhook (no auth).
router.post("/stripe-webhook", stripeWebhook);

module.exports = router;

