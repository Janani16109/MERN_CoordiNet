const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Event = require('../models/Event');

// Create a payment intent for an event registration
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { eventId, quantity = 1, registrationData = {} } = req.body;

    // Validate event and compute amount server-side
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  // event.price is stored in rupees (decimal) in DB; convert to paise for Stripe (smallest currency unit)
  const rupees = Number(event.price) || 0;
  const amount = Math.round(rupees * 100) * quantity; // paise

    // Create payment record
  // Persist registrationData on the payment so webhook can use it to complete registration
  const payment = await Payment.create({ userId, eventId, amount, currency: process.env.PAYMENT_CURRENCY || 'inr', quantity, status: 'pending', registrationData });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: process.env.PAYMENT_CURRENCY || 'inr',
      metadata: { paymentId: payment._id.toString(), eventId: eventId.toString(), userId: userId.toString() }
    });

    // Save stripePaymentIntentId
    payment.stripePaymentIntentId = paymentIntent.id;
    await payment.save();

    res.status(201).json({ success: true, clientSecret: paymentIntent.client_secret, paymentId: payment._id });
  } catch (err) {
    next(err);
  }
};

// Webhook to handle payment events
exports.handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET is not set. Webhook signature verification cannot run.');
  }

  let stripeEvent;
  try {
    // bodyParser.raw sets req.body to a Buffer for the webhook route
    // Prefer the raw buffer captured by express.json's verify middleware.
    // Some setups (older code) may have used bodyParser.raw for the /webhook route
    // which sets req.body to a Buffer. Support both patterns.
    let rawBody = req.rawBody || req.body;

    if (!rawBody) {
      throw new Error('Request body is empty when attempting to verify Stripe webhook signature');
    }

    // If req.body is a parsed object (not a Buffer), convert it back to a Buffer
    // by stringifying. Stripe requires the original raw bytes for signature verification.
    if (typeof rawBody === 'object' && !Buffer.isBuffer(rawBody)) {
      rawBody = Buffer.from(JSON.stringify(rawBody));
      console.warn('Stripe webhook: req.body was parsed; reconstructing rawBody from JSON string. For best results ensure the webhook route receives raw body (express.json verify).');
    }

    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature mismatch or invalid payload:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (stripeEvent.type === 'payment_intent.succeeded') {
      const pi = stripeEvent.data.object;
      const paymentId = pi.metadata?.paymentId;
      const eventId = pi.metadata?.eventId;
      const userId = pi.metadata?.userId;

      if (paymentId) {
        const payment = await Payment.findById(paymentId);
        if (payment && payment.status !== 'succeeded') {
          payment.status = 'succeeded';
          await payment.save();

          // Create registration on the associated Event
          try {
            const EventModel = require('../models/Event');
            const User = require('../models/User');
            const eventDoc = await EventModel.findById(eventId);
            const userDoc = await User.findById(userId);

            if (eventDoc && userDoc) {
              // Prevent duplicates and overbooking
              if (!eventDoc.isUserRegistered(userDoc._id) && eventDoc.participants.length < eventDoc.capacity) {
                eventDoc.participants.push({
                  userId: userDoc._id,
                  name: `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() || userDoc.email,
                  email: userDoc.email,
                  college: userDoc.college || '',
                  registrationDate: new Date()
                });
                await eventDoc.save();
                console.log(`Registered user ${userDoc._id} for event ${eventDoc._id} after payment ${paymentId}`);
              } else {
                console.log(`User ${userId} already registered or event full for event ${eventId}`);
              }
            } else {
              console.warn('Event or User not found for payment webhook', { eventId, userId });
            }
          } catch (regErr) {
            console.error('Failed to create registration from webhook:', regErr);
          }

          // TODO: send confirmation email to user
        }
      }
    }

    if (stripeEvent.type === 'payment_intent.payment_failed') {
      const pi = stripeEvent.data.object;
      const paymentId = pi.metadata?.paymentId;
      if (paymentId) {
        await Payment.findByIdAndUpdate(paymentId, { status: 'failed' });
      }
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};

// Client-side confirmation endpoint: accepts paymentIntentId, receiptUrl, amountPaise
exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, receiptUrl, amountPaise } = req.body;
    if (!paymentIntentId) return res.status(400).json({ success: false, message: 'paymentIntentId is required' });

    // Try to find Payment by stripePaymentIntentId or by paymentIntentId stored in metadata
    let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

    if (!payment) {
      // As a fallback, try to find by matching metadata in Payment (if any saved elsewhere)
      payment = await Payment.findOne({ 'metadata.stripePaymentIntentId': paymentIntentId });
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    payment.receiptUrl = receiptUrl || payment.receiptUrl;
    if (amountPaise) payment.amount = amountPaise; // overwrite amount if provided (paise)
    payment.status = 'succeeded';
    await payment.save();

    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};
