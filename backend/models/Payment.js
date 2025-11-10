const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  amount: { type: Number, required: true }, // in paise (smallest currency unit)
  currency: { type: String, default: 'usd' },
  quantity: { type: Number, default: 1 },
  stripePaymentIntentId: { type: String },
  receiptUrl: { type: String },
  metadata: { type: Object },
  status: { type: String, enum: ['pending', 'succeeded', 'failed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
