const mongoose = require('mongoose');

const roleRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  college: {
    type: String
  },
  requestedRole: {
    type: String,
    enum: ['organizer'],
    default: 'organizer'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  handledBy: {
    type: String
  },
  handledAt: {
    type: Date
  }
});

module.exports = mongoose.model('RoleRequest', roleRequestSchema);
