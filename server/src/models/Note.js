const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, default: '' },
  folder: { type: String, default: '默认', trim: true },
  tags: [{ type: String, trim: true }],
  isPinned: { type: Boolean, default: false },
  aiSummary: { type: String, default: '' },
  wordCount: { type: Number, default: 0 }
}, { timestamps: true });

noteSchema.index({ userId: 1, updatedAt: -1 });
noteSchema.index({ userId: 1, folder: 1 });
noteSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    this.wordCount = this.content.replace(/<[^>]*>/g, '').length;
  }
  next();
});

module.exports = mongoose.model('Note', noteSchema);
