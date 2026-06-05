const mongoose = require('mongoose');

const codeSnippetSchema = new mongoose.Schema(
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
    language: {
      type: String,
      enum: ['c', 'cpp', 'python', 'java', 'javascript', 'typescript', 'html', 'css', 'go', 'rust', 'sql', 'bash', 'markdown', 'other'],
      required: true,
    },
    code: {
      type: String,
      default: '',
    },
    aiComments: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

codeSnippetSchema.index({ userId: 1, language: 1 });
codeSnippetSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CodeSnippet', codeSnippetSchema);
