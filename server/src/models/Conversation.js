const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['oral_practice', 'general'],
      required: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        content: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, type: 1 });
conversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
