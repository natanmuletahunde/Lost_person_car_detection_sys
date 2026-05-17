const mongoose = require('mongoose');

const sightingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['person', 'vehicle', 'cctv'],
    required: [true, 'Sighting type is required'],
  },
  name: {
    type: String,
    trim: true,
  },
  plateNumber: {
    type: String,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: [true, 'Location coordinates are required'],
    },
    address: {
      type: String,
      default: '',
    },
  },
  images: [{
    type: String,
  }],
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'confirmed', 'resolved'],
    default: 'pending',
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  confirmedAt: {
    type: Date,
    default: null,
  },
  notes: [{
    text: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

sightingSchema.index({ location: '2dsphere' });
sightingSchema.index({ reportedAt: -1 });
sightingSchema.index({ status: 1 });
sightingSchema.index({ user: 1 });

module.exports = mongoose.model('Sighting', sightingSchema);
