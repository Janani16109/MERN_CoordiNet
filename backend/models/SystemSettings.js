const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'Coordinet'
    },
    siteDescription: {
      type: String,
      default: 'Event coordination platform'
    },
    contactEmail: {
      type: String,
      default: 'support@coordinet.com'
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    registrationEnabled: {
      type: Boolean,
      default: true
    },
    maxEventsPerUser: {
      type: Number,
      default: 10
    },
    maxParticipantsPerEvent: {
      type: Number,
      default: 100
    },
    defaultEventDuration: {
      type: Number, // in minutes
      default: 60
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);