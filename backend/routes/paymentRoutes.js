const express = require('express');
const router = express.Router();
const { createPaymentIntent, handleWebhook } = require('../controllers/paymentController');
const { confirmPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const bodyParser = require('body-parser');

// Route to create payment intent (requires auth)
router.post('/create-payment-intent', protect, createPaymentIntent);

// Stripe webhook: the server captures the raw request body (req.rawBody) via
// express.json's `verify` option in server.js, so we can use the normal handler here.
router.post('/webhook', handleWebhook);

// Client-side confirmation fallback to store receipt/intent info when webhook may be delayed
router.post('/confirm', protect, express.json(), confirmPayment);

module.exports = router;
