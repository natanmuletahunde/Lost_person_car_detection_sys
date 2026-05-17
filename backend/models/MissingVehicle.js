const mongoose = require('mongoose');

const missingVehicleSchema = new mongoose.Schema({
  caseId: String,

  type: {
    type: String,
    default: "Vehicle"
  },

  brand: String,
  model: String,
  submodel: String,
  color: String,

  plateType: String,
  region: String,
  code: String,
  plateNumber: String,

  vehicleDescription: String,

  location: String,
  lastSeenDate: Date,
  lastSeenTime: String,

  imagePreview: String,

  status: {
    type: String,
    enum: ['Pending', 'Active', 'Resolved', 'Rejected'],
    default: 'Pending'
  },

  verified: {
    type: Boolean,
    default: false
  },

  verificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  },

  ownershipDocumentUrl: {
    type: [String],
    default: []
  },

  reportedBy: {
    userId: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    role: String,
    telegramUsername: String
  },

  contactMethods: {
    email: String,
    phone: String,
    telegram: String
  },

  matches: [],
  notes: []
});

missingVehicleSchema.index({ 'reportedBy.userId': 1 });
missingVehicleSchema.index({ 'reportedBy.email': 1 });

module.exports = mongoose.model('MissingVehicle', missingVehicleSchema);