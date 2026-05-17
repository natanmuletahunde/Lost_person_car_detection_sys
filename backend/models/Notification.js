const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["feedback", "alert", "system", "general", "info", "success", "warning"],
      default: "general",
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    meta: {
      feedbackId: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);