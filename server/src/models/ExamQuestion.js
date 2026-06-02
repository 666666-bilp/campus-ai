const mongoose = require('mongoose');

const examQuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    questions: [
      {
        type: {
          type: String,
          enum: ['single', 'multiple', 'judge', 'essay'],
          required: true,
        },
        stem: { type: String, default: '' },
        options: [{ type: String }],
        answer: { type: String, default: '' },
        analysis: { type: String, default: '' },
        source: { type: String, default: '' },
      },
    ],
    wrongBook: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        wrongCount: { type: Number, default: 1 },
        lastWrongTime: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

examQuestionSchema.index({ userId: 1, subject: 1 });
examQuestionSchema.index({ 'wrongBook.questionId': 1 });

module.exports = mongoose.model('ExamQuestion', examQuestionSchema);
