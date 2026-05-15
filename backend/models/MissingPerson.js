// models/MissingPerson.js
const mongoose = require('mongoose');

const missingPersonSchema = new mongoose.Schema({
  firstName: String,
  middleName: String,
  lastName: String,
  gender: String,
  height: String,
  weight: String,
  age: Number,
  description: String,
  location: String,

  lastSeenDate: Date,
  lastSeenTime: String,

  type: {
    type: String,
    default: "Person"
  },

  caseId: String,

  reportedBy: {
    userId: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    role: String,
    telegramChatId: String,        // ← ADD THIS LINE
    telegramUsername: String       // Optional: you can keep both
  },

  reportDate: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    default: "Active"
  },

  verified: {
    type: Boolean,
    default: false
  },

  images: {
    type: [String],
    validate: {
      validator: function (val) {
        return val.length >= 2;
      },
      message: 'At least 2 images are required'
    }
  },

  matches: [],
  notes: []
});

missingPersonSchema.index({ 'reportedBy.userId': 1 });
missingPersonSchema.index({ 'reportedBy.email': 1 });

module.exports = mongoose.model('MissingPerson', missingPersonSchema);