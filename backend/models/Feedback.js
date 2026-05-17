const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['bug', 'feature', 'general', 'complaint'],
    required: true,
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    maxlength: [200, 'Subject cannot exceed 200 characters'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'closed'],
    default: 'pending',
  },
  response: {
    text: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
  },
}, {
  timestamps: true,
});

feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
