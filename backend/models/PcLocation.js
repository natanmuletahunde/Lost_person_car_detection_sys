const mongoose = require('mongoose');

const pcLocationSchema = new mongoose.Schema(
  {
    deviceName: {
      type: String,
      default: 'CCTV-PC'
    },

    latitude: {
      type: Number,
      required: true
    },

    longitude: {
      type: Number,
      required: true
    },

    address: {
      type: String,
      default: ''
    },

    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'PcLocation',
  pcLocationSchema
);