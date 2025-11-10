const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    notification: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'zh'],
      default: 'en'
    },
    privacy: {
      showProfile: {
        type: Boolean,
        default: true
      },
      showActivity: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('UserSettings', UserSettingsSchema);