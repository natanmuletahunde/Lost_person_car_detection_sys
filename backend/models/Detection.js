const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const detectionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
    default: () => parseInt(uuidv4().replace(/-/g, '').slice(0, 12), 16) % 1000000000000
  },
  type: {
    type: String,
    required: true,
    enum: ['Person', 'Car'],
    default: 'Person'
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'MissingPerson'        // Changed to match your controller
  },
  name: {
    type: String,
    required: function() { return this.type === 'Person'; },
    trim: true,
    default: ''
  },
  licensePlate: {
    type: String,
    required: function() { return this.type === 'Car'; },
    trim: true,
    uppercase: true,
    default: ''
  },
  timestamp: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },

  // ==================== LOCATION FIELDS ====================
  location: { 
    type: String, 
    required: true, 
    trim: true,
    default: 'Real-time Location'
  },
  latitude: { 
    type: Number, 
    required: false,
    min: -90,
    max: 90 
  },
  longitude: { 
    type: Number, 
    required: false,
    min: -180,
    max: 180 
  },
  locationLink: { 
    type: String, 
    trim: true 
  },

  detectionImage: { 
    type: String, 
    required: true, 
    trim: true 
  },
  confidence: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 1 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['Pending', 'Confirmed', 'False'], 
    default: 'Pending' 
  },
  priority: { 
    type: String, 
    required: true, 
    enum: ['High', 'Normal'], 
    default: 'Normal' 
  },
  behavior: { 
    type: String, 
    required: true, 
    default: 'Detected' 
  }
}, {
  timestamps: true
});

// Optional: Create index for faster queries
detectionSchema.index({ registrationId: 1, createdAt: -1 });
detectionSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('Detection', detectionSchema);