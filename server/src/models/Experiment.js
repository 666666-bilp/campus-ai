const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      objective: { type: String, default: '' },
      theory: { type: String, default: '' },
      equipment: { type: String, default: '' },
      procedure: { type: String, default: '' },
      data: { type: String, default: '' },
      analysis: { type: String, default: '' },
      conclusion: { type: String, default: '' },
    },
    chartData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

experimentSchema.index({ userId: 1, course: 1 });
experimentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Experiment', experimentSchema);
