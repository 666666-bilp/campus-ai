const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      trim: true,
    },
    prompt: {
      type: String,
      default: '',
    },
    response: {
      type: String,
      default: '',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
    model: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

aiLogSchema.index({ userId: 1, type: 1 });
aiLogSchema.index({ userId: 1, createdAt: -1 });
aiLogSchema.index({ type: 1 });

module.exports = mongoose.model('AILog', aiLogSchema);
